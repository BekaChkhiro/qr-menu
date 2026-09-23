import { describe, it, expect, vi } from 'vitest';
import { hasEnded, isScheduled, isWithinDateRange } from '../time-windows';

// T24.14 — an operator picking a date means that whole café-local day.
//
// `<input type="date">` yields "YYYY-MM-DD", which parses to UTC midnight —
// 04:00 in Tbilisi. Comparing instants made "ends today" expire at 04:00 and
// "starts today" begin at 04:00, which is why a promotion had to be dated
// YESTERDAY to be live right now.

const TZ = 'Asia/Tbilisi';

/** What the drawer stores for a date the operator picked. */
const picked = (isoDay: string) => new Date(isoDay);

describe('promotion validity dates are whole café-local days', () => {
  // 14:00 Tbilisi on 21 Aug — the middle of a normal working day.
  const now = new Date('2026-08-21T10:00:00Z');

  it('a promotion starting today is live right now, not at 04:00', () => {
    const p = { startDate: picked('2026-08-21'), endDate: null };
    expect(isScheduled(p, now, TZ)).toBe(false);
    expect(isWithinDateRange(p, now, TZ)).toBe(true);
  });

  it('a promotion ending today is still live, not expired since 04:00', () => {
    const p = { startDate: null, endDate: picked('2026-08-21') };
    expect(hasEnded(p, now, TZ)).toBe(false);
    expect(isWithinDateRange(p, now, TZ)).toBe(true);
  });

  it('a single-day promotion dated today is live all day', () => {
    const p = { startDate: picked('2026-08-21'), endDate: picked('2026-08-21') };
    expect(isWithinDateRange(p, now, TZ)).toBe(true);
  });

  it('still live one minute before café midnight', () => {
    // 23:59 Tbilisi on 21 Aug.
    const lateNight = new Date('2026-08-21T19:59:00Z');
    const p = { startDate: picked('2026-08-21'), endDate: picked('2026-08-21') };
    expect(isWithinDateRange(p, lateNight, TZ)).toBe(true);
  });

  it('expired once the café day rolls over', () => {
    // 00:30 Tbilisi on 22 Aug.
    const afterMidnight = new Date('2026-08-21T20:30:00Z');
    const p = { startDate: picked('2026-08-21'), endDate: picked('2026-08-21') };
    expect(hasEnded(p, afterMidnight, TZ)).toBe(true);
    expect(isWithinDateRange(p, afterMidnight, TZ)).toBe(false);
  });

  it('live from the first minute of its start day', () => {
    // 00:30 Tbilisi on 21 Aug.
    const justAfterMidnight = new Date('2026-08-20T20:30:00Z');
    const p = { startDate: picked('2026-08-21'), endDate: null };
    expect(isScheduled(p, justAfterMidnight, TZ)).toBe(false);
  });

  it('a future start date is still scheduled', () => {
    const p = { startDate: picked('2026-08-22'), endDate: null };
    expect(isScheduled(p, now, TZ)).toBe(true);
    expect(isWithinDateRange(p, now, TZ)).toBe(false);
  });

  it('a past end date is still ended', () => {
    const p = { startDate: null, endDate: picked('2026-08-20') };
    expect(hasEnded(p, now, TZ)).toBe(true);
  });

  it('no dates at all means always within range (T24.1)', () => {
    const p = { startDate: null, endDate: null };
    expect(isScheduled(p, now, TZ)).toBe(false);
    expect(hasEnded(p, now, TZ)).toBe(false);
    expect(isWithinDateRange(p, now, TZ)).toBe(true);
  });

  it('falls back to the default zone when the menu carries a bad timezone', () => {
    const p = { startDate: picked('2026-08-21'), endDate: picked('2026-08-21') };
    expect(isWithinDateRange(p, now, 'Not/AZone')).toBe(true);
  });
});


describe('long-running public menu queries', () => {
  it('keeps future promotions available when they become live after module load', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-20T10:00:00Z'));
    vi.resetModules();
    try {
      const { publicMenuSelect, isPromotionLive } = await import('@/lib/public-menu');
      const promotion = {
        startDate: '2026-08-21T00:00:00Z',
        endDate: null,
        timeRestrictions: null,
      };
      expect(publicMenuSelect.promotions.where).toEqual({ isActive: true });
      expect(isPromotionLive(promotion, TZ)).toBe(false);
      vi.setSystemTime(new Date('2026-08-21T10:00:00Z'));
      expect(isPromotionLive(promotion, TZ)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses the menu timezone rather than the default Tbilisi day', () => {
    const promotion = { startDate: null, endDate: picked('2026-08-21') };
    const now = new Date('2026-08-21T21:00:00Z');
    expect(isWithinDateRange(promotion, now, 'Europe/London')).toBe(true);
    expect(isWithinDateRange(promotion, now, TZ)).toBe(false);
  });
});
