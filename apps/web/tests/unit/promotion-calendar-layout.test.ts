import { describe, expect, it } from 'vitest';

import {
  layoutMonth,
  monthGridRange,
  weekdayRunsLabel,
} from '@/components/admin/promotion-calendar';
import {
  dayInZone,
  dayNumber,
  expandPromotionSegments,
} from '@/lib/promotions/calendar-days';

// October 2026: the 1st is a Thursday, so the Monday-first grid runs
// 28 Sep → 1 Nov (five weeks).
const d = (month: number, day: number) => dayNumber(2026, month, day);

describe('dayInZone (re-exported for the calendar)', () => {
  it('reads a bare YYYY-MM-DD (UTC midnight) as that day in Tbilisi', () => {
    expect(dayInZone('2026-10-20T00:00:00.000Z', 'Asia/Tbilisi')).toBe(d(9, 20));
  });

  it('counts late-evening UTC instants on the next café-local day', () => {
    expect(dayInZone('2026-10-20T21:00:00.000Z', 'Asia/Tbilisi')).toBe(d(9, 21));
  });
});

describe('monthGridRange', () => {
  it('covers 28 Sep → 1 Nov for October 2026', () => {
    expect(monthGridRange(2026, 9)).toEqual({ start: d(8, 28), end: d(10, 1) });
  });
});

describe('layoutMonth', () => {
  it('builds Monday-first weeks covering the month', () => {
    const weeks = layoutMonth([], 2026, 9);
    expect(weeks).toHaveLength(5);
    expect(weeks[0].days[0]).toBe(d(8, 28));
    expect(weeks[4].days[6]).toBe(d(10, 1));
    expect(weeks.every((w) => w.bars.length === 0 && w.laneCount === 0)).toBe(true);
  });

  it('splits a range at week boundaries and flags the continuing edges', () => {
    const weeks = layoutMonth([{ id: 'a', from: d(9, 14), to: d(9, 28) }], 2026, 9);
    const bars = weeks.flatMap((w, wi) => w.bars.map((b) => ({ wi, ...b })));
    expect(bars).toEqual([
      { wi: 2, id: 'a', startCol: 2, endCol: 6, lane: 0, continuesLeft: false, continuesRight: true },
      { wi: 3, id: 'a', startCol: 0, endCol: 6, lane: 0, continuesLeft: true, continuesRight: true },
      { wi: 4, id: 'a', startCol: 0, endCol: 2, lane: 0, continuesLeft: true, continuesRight: false },
    ]);
  });

  it('runs open-ended sides to the grid edge', () => {
    const weeks = layoutMonth([{ id: 'from', from: d(9, 30), to: null }], 2026, 9);
    expect(weeks[4].bars[0]).toMatchObject({ startCol: 4, endCol: 6, continuesRight: true });
    expect(weeks.slice(0, 4).every((w) => w.bars.length === 0)).toBe(true);
  });

  it('packs overlaps into lanes and turns the fourth into per-day "+N"', () => {
    const weeks = layoutMonth(
      [
        { id: 'long', from: d(9, 14), to: d(9, 28) },
        { id: 'combo', from: d(9, 17), to: d(9, 24) },
        { id: 'ends-today', from: d(9, 8), to: d(9, 22) },
        { id: 'wine', from: d(9, 20), to: d(10, 30) },
      ],
      2026,
      9,
    );
    const week = weeks[3]; // 19–25 Oct
    expect(week.laneCount).toBe(3);
    expect(week.bars.map((b) => b.id).sort()).toEqual(['combo', 'ends-today', 'long']);
    // "wine" covers Tue–Sun of that week.
    expect(week.hidden).toEqual([0, 1, 1, 1, 1, 1, 1]);
    // The next week has room again.
    expect(weeks[4].bars.map((b) => b.id).sort()).toEqual(['long', 'wine']);
    expect(weeks[4].hidden.every((n) => n === 0)).toBe(true);
  });

  it('reuses a lane once the earlier bar has ended', () => {
    const weeks = layoutMonth(
      [
        { id: 'a', from: d(9, 5), to: d(9, 6) },
        { id: 'b', from: d(9, 8), to: d(9, 9) },
      ],
      2026,
      9,
    );
    expect(weeks[1].bars.map((b) => b.lane)).toEqual([0, 0]);
    expect(weeks[1].laneCount).toBe(1);
  });

  it('paints a Mon/Wed promotion as one-day segments sharing a lane, never a continuous bar', () => {
    const grid = monthGridRange(2026, 9);
    const segments = expandPromotionSegments(
      {
        startDate: '2026-10-01T00:00:00.000Z',
        endDate: '2026-10-31T00:00:00.000Z',
        timeRestrictions: { enabled: true, days: ['mon', 'wed'] },
      },
      { fromDay: grid.start - 1, toDay: grid.end + 1, timeZone: 'Asia/Tbilisi' },
    );
    const weeks = layoutMonth(
      segments.map((s) => ({ id: 'mw', ...s })),
      2026,
      9,
    );
    // Week of 5–11 Oct: Monday 5 and Wednesday 7, both in lane 0, no chevrons.
    expect(weeks[1].bars).toEqual([
      { id: 'mw', startCol: 0, endCol: 0, lane: 0, continuesLeft: false, continuesRight: false },
      { id: 'mw', startCol: 2, endCol: 2, lane: 0, continuesLeft: false, continuesRight: false },
    ]);
    expect(weeks[1].laneCount).toBe(1);
    // Nothing before 1 Oct (week 28 Sep – 4 Oct holds no Mon/Wed in range).
    expect(weeks[0].bars).toEqual([]);
    // Across the month: 5, 7, 12, 14, 19, 21, 26, 28 → eight single-day bars.
    expect(weeks.flatMap((w) => w.bars)).toHaveLength(8);
  });

  it('a permanent promotion expanded one day past the grid gets chevrons on both edges', () => {
    const grid = monthGridRange(2026, 9);
    const segments = expandPromotionSegments(
      { startDate: null, endDate: null },
      { fromDay: grid.start - 1, toDay: grid.end + 1 },
    );
    const weeks = layoutMonth(segments.map((s) => ({ id: 'p', ...s })), 2026, 9);
    expect(weeks).toHaveLength(5);
    expect(weeks.every((w) => w.bars.length === 1)).toBe(true);
    expect(weeks[0].bars[0]).toMatchObject({ startCol: 0, endCol: 6, continuesLeft: true, continuesRight: true });
    expect(weeks[4].bars[0]).toMatchObject({ startCol: 0, endCol: 6, continuesLeft: true, continuesRight: true });
  });
});

describe('weekdayRunsLabel', () => {
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const name = (i: number) => names[i];

  it('says "every day" for all seven', () => {
    expect(weekdayRunsLabel([0, 1, 2, 3, 4, 5, 6], name, 'Every day')).toBe('Every day');
  });

  it('lists separate days and collapses runs of three or more', () => {
    expect(weekdayRunsLabel([0, 2], name, 'Every day')).toBe('Mon, Wed');
    expect(weekdayRunsLabel([2, 3, 4, 5, 6], name, 'Every day')).toBe('Wed–Sun');
    expect(weekdayRunsLabel([0, 1, 3, 4, 5], name, 'Every day')).toBe('Mon, Tue, Thu–Sat');
    expect(weekdayRunsLabel([6, 0], name, 'Every day')).toBe('Mon, Sun');
  });
});
