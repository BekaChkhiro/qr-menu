import { describe, expect, it } from 'vitest';

import {
  dayInZone,
  dayNumber,
  expandPromotionDays,
  expandPromotionSegments,
  mondayIndex,
  restrictedWeekdays,
  toSegments,
  weekdayKeyOfDay,
} from '@/lib/promotions/calendar-days';
import { getPromotionStatus } from '@/lib/promotions/status';

// October 2026: the 1st is a Thursday. Mondays are 5, 12, 19, 26;
// Wednesdays are 7, 14, 21, 28.
const oct = (day: number) => dayNumber(2026, 9, day);
const sep = (day: number) => dayNumber(2026, 8, day);
const OCT = { fromDay: oct(1), toDay: oct(31), timeZone: 'Asia/Tbilisi' };
const date = (iso: string) => `${iso}T00:00:00.000Z`;

const dayList = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

describe('day arithmetic', () => {
  it('reads a bare YYYY-MM-DD (UTC midnight) as that day in Tbilisi', () => {
    expect(dayInZone(date('2026-10-20'), 'Asia/Tbilisi')).toBe(oct(20));
  });

  it('counts late-evening UTC instants on the next café-local day', () => {
    expect(dayInZone('2026-10-20T21:00:00.000Z', 'Asia/Tbilisi')).toBe(oct(21));
  });

  it('keeps an evening instant on the same day in a zone west of UTC', () => {
    expect(dayInZone('2026-10-20T21:00:00.000Z', 'America/New_York')).toBe(oct(20));
  });

  it('falls back to Tbilisi for an unknown zone and rejects invalid dates', () => {
    expect(dayInZone('2026-10-20T21:00:00.000Z', 'Not/AZone')).toBe(oct(21));
    expect(dayInZone('not a date')).toBeNull();
  });

  it('indexes weekdays Monday-first', () => {
    expect(mondayIndex(oct(5))).toBe(0);
    expect(mondayIndex(oct(11))).toBe(6);
    expect(weekdayKeyOfDay(oct(7))).toBe('wed');
  });
});

describe('restrictedWeekdays', () => {
  it('is null when restrictions are off or absent', () => {
    expect(restrictedWeekdays(null)).toBeNull();
    expect(restrictedWeekdays({ enabled: false, windows: { mon: { start: '09:00', end: '18:00' } } })).toBeNull();
  });

  it('reads canonical windows and legacy days[]', () => {
    expect(
      restrictedWeekdays({
        enabled: true,
        windows: { wed: { start: '12:00', end: '16:00' }, mon: { start: '12:00', end: '16:00' } },
      }),
    ).toEqual(new Set([0, 2]));
    expect(restrictedWeekdays({ enabled: true, days: ['sat', 'sun'] })).toEqual(new Set([5, 6]));
  });

  it('is null for an empty day list', () => {
    expect(restrictedWeekdays({ enabled: true, days: [] })).toBeNull();
    expect(restrictedWeekdays({ enabled: true, windows: {} })).toBeNull();
  });
});

describe('expandPromotionDays', () => {
  it('permanent: every day of the window', () => {
    expect(expandPromotionDays({ startDate: null, endDate: null }, OCT)).toEqual(
      dayList(oct(1), oct(31)),
    );
  });

  it('dated: start and end inclusive, clipped to the window', () => {
    expect(
      expandPromotionDays({ startDate: date('2026-10-14'), endDate: date('2026-10-18') }, OCT),
    ).toEqual(dayList(oct(14), oct(18)));
    expect(
      expandPromotionDays({ startDate: date('2026-10-28'), endDate: date('2026-11-20') }, OCT),
    ).toEqual(dayList(oct(28), oct(31)));
  });

  it('open on one side runs to the window edge on that side', () => {
    expect(expandPromotionDays({ startDate: date('2026-10-30'), endDate: null }, OCT)).toEqual(
      dayList(oct(30), oct(31)),
    );
    expect(expandPromotionDays({ startDate: null, endDate: date('2026-10-02') }, OCT)).toEqual(
      dayList(oct(1), oct(2)),
    );
  });

  it('weekday-restricted (Mon/Wed) inside Oct 2026 → only Mondays and Wednesdays', () => {
    const days = expandPromotionDays(
      {
        startDate: date('2026-10-01'),
        endDate: date('2026-10-31'),
        timeRestrictions: {
          enabled: true,
          windows: { mon: { start: '12:00', end: '16:00' }, wed: { start: '12:00', end: '16:00' } },
        },
      },
      OCT,
    );
    expect(days).toEqual([5, 7, 12, 14, 19, 21, 26, 28].map(oct));
  });

  it('permanent + weekday: the weekdays of every week in the window', () => {
    const days = expandPromotionDays(
      { startDate: null, endDate: null, timeRestrictions: { enabled: true, days: ['sun'] } },
      OCT,
    );
    expect(days).toEqual([4, 11, 18, 25].map(oct));
  });

  it('dated + weekday: weekday filter applies within the date bounds only', () => {
    const days = expandPromotionDays(
      {
        startDate: date('2026-10-06'),
        endDate: date('2026-10-20'),
        timeRestrictions: { enabled: true, days: ['mon', 'wed'] },
      },
      OCT,
    );
    expect(days).toEqual([7, 12, 14, 19].map(oct));
  });

  it('paused: the helper still returns the days; the status says paused', () => {
    const paused = {
      startDate: date('2026-10-10'),
      endDate: date('2026-10-12'),
      isActive: false,
    };
    expect(expandPromotionDays(paused, OCT)).toEqual(dayList(oct(10), oct(12)));
    expect(getPromotionStatus(paused, new Date('2026-10-22T08:00:00Z'))).toBe('paused');
  });

  it('range crossing a month boundary (28 Sep → 5 Oct) in a wider grid window', () => {
    const grid = { fromDay: sep(28), toDay: dayNumber(2026, 10, 1), timeZone: 'Asia/Tbilisi' };
    expect(
      expandPromotionDays({ startDate: date('2026-09-28'), endDate: date('2026-10-05') }, grid),
    ).toEqual(dayList(sep(28), oct(5)));
    // And clipped to October only.
    expect(
      expandPromotionDays({ startDate: date('2026-09-28'), endDate: date('2026-10-05') }, OCT),
    ).toEqual(dayList(oct(1), oct(5)));
  });

  it('timeRestrictions.enabled=false with days set is ignored', () => {
    const days = expandPromotionDays(
      {
        startDate: date('2026-10-05'),
        endDate: date('2026-10-11'),
        timeRestrictions: { enabled: false, days: ['mon', 'wed'] },
      },
      OCT,
    );
    expect(days).toEqual(dayList(oct(5), oct(11)));
  });

  it('enabled with an empty days array runs every day', () => {
    const days = expandPromotionDays(
      {
        startDate: date('2026-10-05'),
        endDate: date('2026-10-11'),
        timeRestrictions: { enabled: true, days: [], startTime: '09:00', endTime: '18:00' },
      },
      OCT,
    );
    expect(days).toEqual(dayList(oct(5), oct(11)));
  });

  it('an inverted range and a range outside the window yield nothing', () => {
    expect(
      expandPromotionDays({ startDate: date('2026-10-20'), endDate: date('2026-10-10') }, OCT),
    ).toEqual([]);
    expect(
      expandPromotionDays({ startDate: date('2026-11-03'), endDate: date('2026-11-20') }, OCT),
    ).toEqual([]);
  });

  it('respects the café timezone for the date bounds', () => {
    // 2026-10-05T21:00Z is already the 6th in Tbilisi, still the 5th in New York.
    const p = { startDate: '2026-10-05T21:00:00.000Z', endDate: '2026-10-07T21:00:00.000Z' };
    expect(expandPromotionDays(p, { ...OCT, timeZone: 'Asia/Tbilisi' })).toEqual(
      dayList(oct(6), oct(8)),
    );
    expect(expandPromotionDays(p, { ...OCT, timeZone: 'America/New_York' })).toEqual(
      dayList(oct(5), oct(7)),
    );
  });
});

describe('segments', () => {
  it('collapses consecutive days and keeps gaps apart', () => {
    expect(toSegments([1, 2, 3, 5, 7, 8])).toEqual([
      { from: 1, to: 3 },
      { from: 5, to: 5 },
      { from: 7, to: 8 },
    ]);
    expect(toSegments([])).toEqual([]);
  });

  it('Mon/Wed promotion becomes one single-day segment per run day', () => {
    const segments = expandPromotionSegments(
      { startDate: null, endDate: null, timeRestrictions: { enabled: true, days: ['mon', 'wed'] } },
      { fromDay: oct(5), toDay: oct(11) },
    );
    expect(segments).toEqual([
      { from: oct(5), to: oct(5) },
      { from: oct(7), to: oct(7) },
    ]);
  });

  it('a permanent promotion is one segment over the whole window', () => {
    expect(expandPromotionSegments({ startDate: null, endDate: null }, OCT)).toEqual([
      { from: oct(1), to: oct(31) },
    ]);
  });
});
