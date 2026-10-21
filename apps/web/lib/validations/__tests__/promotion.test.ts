import { describe, it, expect } from 'vitest'
import { createPromotionSchema } from '../promotion'

// T1.5 — the drawer's "Date range" switch. Off = open-ended (both dates null);
// on = at least one date is required and the end must follow the start.
const base = { titleKa: 'Lunch deal', isActive: true }
const day = (iso: string) => new Date(iso)

function issuePaths(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return result.success ? [] : result.error!.issues.map((i) => i.path.join('.'))
}

describe('createPromotionSchema date range', () => {
  it('switch on with at least one date is valid (start only, end only, both)', () => {
    expect(
      createPromotionSchema.safeParse({ ...base, dateRangeEnabled: true, startDate: day('2026-10-21') }).success,
    ).toBe(true)
    expect(
      createPromotionSchema.safeParse({ ...base, dateRangeEnabled: true, endDate: day('2026-10-30') }).success,
    ).toBe(true)
    expect(
      createPromotionSchema.safeParse({
        ...base,
        dateRangeEnabled: true,
        startDate: day('2026-10-21'),
        endDate: day('2026-10-30'),
      }).success,
    ).toBe(true)
  })

  it('switch on with no dates is rejected on the switch itself', () => {
    const result = createPromotionSchema.safeParse({
      ...base,
      dateRangeEnabled: true,
      startDate: null,
      endDate: null,
    })
    expect(result.success).toBe(false)
    expect(issuePaths(result)).toEqual(['dateRangeEnabled'])
  })

  it('switch on with empty-string dates is rejected (empty means no date)', () => {
    const result = createPromotionSchema.safeParse({
      ...base,
      dateRangeEnabled: true,
      startDate: '',
      endDate: '',
    })
    expect(issuePaths(result)).toEqual(['dateRangeEnabled'])
  })

  it('switch on rejects an end date before the start date', () => {
    const result = createPromotionSchema.safeParse({
      ...base,
      dateRangeEnabled: true,
      startDate: day('2026-10-30'),
      endDate: day('2026-10-21'),
    })
    expect(issuePaths(result)).toEqual(['endDate'])
  })

  it('switch off is valid with no dates, stored as open-ended', () => {
    const result = createPromotionSchema.safeParse({
      ...base,
      dateRangeEnabled: false,
      startDate: null,
      endDate: null,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.startDate).toBeNull()
      expect(result.data.endDate).toBeNull()
    }
  })

  it('switch off ignores stale dates that would fail the ordering check', () => {
    const result = createPromotionSchema.safeParse({
      ...base,
      dateRangeEnabled: false,
      startDate: day('2026-10-30'),
      endDate: day('2026-10-21'),
    })
    expect(result.success).toBe(true)
  })

  it('an omitted switch keeps the API behaviour: no dates is open-ended', () => {
    const result = createPromotionSchema.safeParse({ ...base, startDate: null, endDate: null })
    expect(result.success).toBe(true)
  })
})

// T1.8 — the API must refuse a day break that falls outside its own window.
describe('createPromotionSchema time-window breaks', () => {
  const withWindow = (win: Record<string, string | null>) => ({
    ...base,
    timeRestrictions: { enabled: true, windows: { mon: { start: '09:00', end: '18:00', ...win } } },
  })

  it('a break inside its window is accepted', () => {
    const result = createPromotionSchema.safeParse(withWindow({ breakStart: '13:00', breakEnd: '14:00' }))
    expect(result.success).toBe(true)
  })

  it('a break that runs past the window end is rejected on that day', () => {
    const result = createPromotionSchema.safeParse(withWindow({ breakStart: '17:00', breakEnd: '19:00' }))
    expect(result.success).toBe(false)
    expect(issuePaths(result)).toEqual(['timeRestrictions.windows.mon.breakEnd'])
  })

  it('a break that starts before the window opens is rejected', () => {
    const result = createPromotionSchema.safeParse(withWindow({ breakStart: '08:00', breakEnd: '10:00' }))
    expect(result.success).toBe(false)
    expect(issuePaths(result)).toEqual(['timeRestrictions.windows.mon.breakEnd'])
  })

  it('a window with no break at all is accepted', () => {
    expect(createPromotionSchema.safeParse(withWindow({ breakStart: null, breakEnd: null })).success).toBe(true)
  })
})
