// T2.8 — which café-local days a promotion runs on.
//
// The calendar must paint the same schedule the public menu evaluates:
//
// - no startDate and no endDate → every day (until the owner switches it off)
// - startDate / endDate → those days inclusive, counted in the café timezone
// - timeRestrictions enabled with per-weekday windows → only those weekdays,
//   combined with the date bounds above (Mon/Wed only → Mondays and
//   Wednesdays, never a continuous bar)
// - timeRestrictions disabled, or enabled with no day configured → no weekday
//   restriction (the same reading isWithinWindows uses)
//
// isActive is NOT applied here: a paused promotion still has its days, the
// calendar styles them as paused.
//
// Everything is expressed in "day numbers" (days since 1970-01-01 of a
// calendar date), so the grid does not depend on the browser's timezone.

import { normalizeWindows, type TimeWindowsValue } from './time-windows';

export const DEFAULT_TZ = 'Asia/Tbilisi';
export const DAY_MS = 86_400_000;

/** Monday-first weekday keys, matching timeRestrictions window keys. */
export const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

// ── Day arithmetic ──────────────────────────────────────────────────────────

const zoneFormatters = new Map<string, Intl.DateTimeFormat>();

function zoneFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = zoneFormatters.get(timeZone);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      f = zoneFormatter(DEFAULT_TZ);
    }
    zoneFormatters.set(timeZone, f);
  }
  return f;
}

/** Day number of a calendar date (month is 0-based, like Date.UTC). */
export function dayNumber(year: number, month: number, day: number): number {
  return Date.UTC(year, month, day) / DAY_MS;
}

/** The café-local calendar day an instant falls on; null for an invalid date. */
export function dayInZone(value: Date | string, timeZone: string = DEFAULT_TZ): number | null {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const parts = zoneFormatter(timeZone).formatToParts(d);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return dayNumber(get('year'), get('month') - 1, get('day'));
}

/** The day as a UTC-midnight Date (for getUTC* reads). */
export function dateOfDay(n: number): Date {
  return new Date(n * DAY_MS);
}

/** 0 = Monday … 6 = Sunday. */
export function mondayIndex(n: number): number {
  return (dateOfDay(n).getUTCDay() + 6) % 7;
}

export function weekdayKeyOfDay(n: number): WeekdayKey {
  return WEEKDAY_KEYS[mondayIndex(n)];
}

// ── Expansion ───────────────────────────────────────────────────────────────

export interface CalendarPromotion {
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  timeRestrictions?: TimeWindowsValue | null;
}

export interface DayWindow {
  /** First day of the window (inclusive). */
  fromDay: number;
  /** Last day of the window (inclusive). */
  toDay: number;
  timeZone?: string;
}

/** A contiguous run of days, inclusive on both sides. */
export interface DaySegment {
  from: number;
  to: number;
}

/**
 * The weekdays (Monday-first indexes) a promotion is limited to, or null when
 * it runs on every weekday. Accepts both the canonical `{ windows }` shape and
 * the legacy `{ days, startTime, endTime }` one.
 */
export function restrictedWeekdays(
  tr: TimeWindowsValue | null | undefined,
): Set<number> | null {
  if (!tr?.enabled) return null;
  const keys = Object.keys(normalizeWindows(tr)).map((k) => k.toLowerCase());
  const indexes = keys
    .map((k) => WEEKDAY_KEYS.indexOf(k as WeekdayKey))
    .filter((i) => i >= 0);
  if (indexes.length === 0) return null;
  return new Set(indexes);
}

/** Café-local first/last day of a promotion; null = open on that side. */
export function promotionDayBounds(
  p: CalendarPromotion,
  timeZone: string = DEFAULT_TZ,
): { from: number | null; to: number | null } {
  const from = p.startDate ? dayInZone(p.startDate, timeZone) : null;
  const to = p.endDate ? dayInZone(p.endDate, timeZone) : null;
  return { from, to };
}

/**
 * Sorted day numbers inside `window` on which the promotion runs.
 * An inverted date range (end before start) yields no days.
 */
export function expandPromotionDays(p: CalendarPromotion, window: DayWindow): number[] {
  const timeZone = window.timeZone ?? DEFAULT_TZ;
  const { from, to } = promotionDayBounds(p, timeZone);
  const start = Math.max(window.fromDay, from ?? window.fromDay);
  const end = Math.min(window.toDay, to ?? window.toDay);
  if (end < start) return [];

  const weekdays = restrictedWeekdays(p.timeRestrictions);
  const days: number[] = [];
  for (let d = start; d <= end; d++) {
    if (weekdays === null || weekdays.has(mondayIndex(d))) days.push(d);
  }
  return days;
}

/** Collapses sorted day numbers into contiguous inclusive segments. */
export function toSegments(days: number[]): DaySegment[] {
  const segments: DaySegment[] = [];
  for (const d of days) {
    const last = segments[segments.length - 1];
    if (last && last.to === d - 1) last.to = d;
    else segments.push({ from: d, to: d });
  }
  return segments;
}

/** `expandPromotionDays` as contiguous segments. */
export function expandPromotionSegments(p: CalendarPromotion, window: DayWindow): DaySegment[] {
  return toSegments(expandPromotionDays(p, window));
}
