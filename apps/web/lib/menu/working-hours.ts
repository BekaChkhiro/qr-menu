// T24.4 — venue working hours.
//
// A menu carries the opening/closing time of the physical venue, plus an
// OPTIONAL mid-day break (split shift: open 09:00–15:00, shut for the break,
// open again 17:00–23:00). Two consumers read it:
//
//   1. the public menu footer — "Mon–Fri 09:00–23:00 (break 15:00–17:00)"
//   2. the promotion / dish "limit rules" editor — the hours pre-fill the
//      per-day windows, so an offer can't be scheduled while the venue is shut.
//
// Stored on `Menu.workingHours` as a plain JSON array, one entry per weekday.

export const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export interface WorkingHoursDay {
  day: WeekdayKey;
  /** Venue shut all day — no window, and the day is excluded from prefills. */
  closed: boolean;
  /** HH:MM opening time. */
  open: string;
  /** HH:MM closing time. `close <= open` means it runs past midnight. */
  close: string;
  /** HH:MM start of the optional mid-day break, or null for no break. */
  breakStart: string | null;
  /** HH:MM end of the optional mid-day break, or null for no break. */
  breakEnd: string | null;
}

const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isHhmm(value: unknown): value is string {
  return typeof value === 'string' && HHMM_RE.test(value);
}

export function defaultWorkingHours(): WorkingHoursDay[] {
  return WEEKDAY_KEYS.map((day) => ({
    day,
    closed: false,
    open: '09:00',
    close: '23:00',
    breakStart: null,
    breakEnd: null,
  }));
}

/**
 * Parse whatever is stored in the `workingHours` JSON column into a full,
 * seven-entry array. Null also covers legacy all-closed arrays, which were
 * previously used to persist the disabled state.
 */
export function normalizeWorkingHours(raw: unknown): WorkingHoursDay[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const byDay = new Map<WeekdayKey, WorkingHoursDay>();
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const day = typeof e.day === 'string' ? (e.day.toLowerCase().slice(0, 3) as WeekdayKey) : null;
    if (!day || !WEEKDAY_KEYS.includes(day)) continue;

    const hasBreak = isHhmm(e.breakStart) && isHhmm(e.breakEnd);
    byDay.set(day, {
      day,
      closed: e.closed === true,
      open: isHhmm(e.open) ? e.open : '09:00',
      close: isHhmm(e.close) ? e.close : '23:00',
      breakStart: hasBreak ? (e.breakStart as string) : null,
      breakEnd: hasBreak ? (e.breakEnd as string) : null,
    });
  }

  if (byDay.size === 0 || [...byDay.values()].every((day) => day.closed)) return null;

  return WEEKDAY_KEYS.map(
    (day) =>
      byDay.get(day) ?? {
        day,
        closed: true,
        open: '09:00',
        close: '23:00',
        breakStart: null,
        breakEnd: null,
      },
  );
}

export interface PrefillWindow {
  start: string;
  end: string;
  breakStart?: string | null;
  breakEnd?: string | null;
}

/**
 * Working hours → the per-day window shape the limit-rules editor authors.
 * Closed days are omitted, which is exactly what "the promotion never runs
 * that day" means downstream.
 */
export function workingHoursToWindows(
  hours: WorkingHoursDay[] | null | undefined,
): Record<string, PrefillWindow> {
  if (!hours) return {};
  const out: Record<string, PrefillWindow> = {};
  for (const h of hours) {
    if (h.closed) continue;
    out[h.day] = {
      start: h.open,
      end: h.close,
      breakStart: h.breakStart,
      breakEnd: h.breakEnd,
    };
  }
  return out;
}

/** True when at least one day is open — i.e. the owner configured something. */
export function hasWorkingHours(hours: WorkingHoursDay[] | null | undefined): boolean {
  return !!hours?.some((h) => !h.closed);
}

export interface WorkingHoursGroup {
  /** Consecutive weekdays that share the exact same schedule. */
  days: WeekdayKey[];
  closed: boolean;
  open: string;
  close: string;
  breakStart: string | null;
  breakEnd: string | null;
}

function sameSchedule(a: WorkingHoursDay, b: WorkingHoursDay): boolean {
  if (a.closed !== b.closed) return false;
  if (a.closed) return true;
  return (
    a.open === b.open &&
    a.close === b.close &&
    a.breakStart === b.breakStart &&
    a.breakEnd === b.breakEnd
  );
}

/**
 * Collapse runs of consecutive days that share a schedule, so the footer can
 * print "Mon–Fri 09:00–23:00" instead of five identical lines.
 */
export function groupWorkingHours(
  hours: WorkingHoursDay[] | null | undefined,
): WorkingHoursGroup[] {
  if (!hours?.length) return [];
  const ordered = WEEKDAY_KEYS.map((day) => hours.find((h) => h.day === day)).filter(
    (h): h is WorkingHoursDay => !!h,
  );

  const groups: WorkingHoursGroup[] = [];
  for (const day of ordered) {
    const last = groups[groups.length - 1];
    const lastDay = last && hours.find((h) => h.day === last.days[last.days.length - 1]);
    if (last && lastDay && sameSchedule(lastDay, day)) {
      last.days.push(day.day);
      continue;
    }
    groups.push({
      days: [day.day],
      closed: day.closed,
      open: day.open,
      close: day.close,
      breakStart: day.breakStart,
      breakEnd: day.breakEnd,
    });
  }
  return groups;
}
