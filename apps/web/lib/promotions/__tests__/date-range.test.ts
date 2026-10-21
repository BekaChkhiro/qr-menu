import { describe, expect, it } from 'vitest';
import { defaultDateRange, DEFAULT_DATE_RANGE_DAYS } from '../date-range';

// The date inputs read/write values via toISOString().split('T')[0], so the
// prefilled values must serialise to the browser's calendar day.
const asInputValue = (d: Date) => d.toISOString().split('T')[0];

describe('defaultDateRange', () => {
  it('starts on the local calendar day and ends DEFAULT_DATE_RANGE_DAYS later', () => {
    const now = new Date(2026, 9, 21, 23, 30); // 21 Oct 2026, late evening local time
    const { startDate, endDate } = defaultDateRange(now);
    expect(asInputValue(startDate)).toBe('2026-10-21');
    expect(asInputValue(endDate)).toBe('2026-10-28');
    expect(DEFAULT_DATE_RANGE_DAYS).toBe(7);
  });

  it('crosses month boundaries', () => {
    const { startDate, endDate } = defaultDateRange(new Date(2026, 9, 28, 9, 0));
    expect(asInputValue(startDate)).toBe('2026-10-28');
    expect(asInputValue(endDate)).toBe('2026-11-04');
  });

  it('keeps the end strictly after the start, as createPromotionSchema requires', () => {
    const { startDate, endDate } = defaultDateRange(new Date(2026, 0, 1));
    expect(endDate.getTime()).toBeGreaterThan(startDate.getTime());
  });
});
