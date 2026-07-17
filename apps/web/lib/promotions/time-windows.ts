// T22.21 — shared day/hour window evaluation for promotions and dish discounts.
//
// Windows are authored per weekday ({ mon: { start: '12:00', end: '14:00' } })
// and evaluated against the CAFÉ's local clock (Menu.timezone), never the
// server's or the visitor's — a visitor abroad previewing a menu must still see
// the café's real schedule.
//
// A window whose end is <= its start is treated as crossing midnight
// (22:00–02:00 means "late evening into the night").

export interface TimeWindow {
  start: string;
  end: string;
}

export interface TimeWindowsValue {
  enabled?: boolean;
  windows?: Record<string, TimeWindow>;
  // legacy flat shape, still present on older rows
  days?: string[];
  startTime?: string;
  endTime?: string;
}

const DEFAULT_TZ = 'Asia/Tbilisi';

const WEEKDAY_FROM_SHORT: Record<string, string> = {
  Sun: 'sun',
  Mon: 'mon',
  Tue: 'tue',
  Wed: 'wed',
  Thu: 'thu',
  Fri: 'fri',
  Sat: 'sat',
};

/** Legacy `{ days, startTime, endTime }` → canonical per-day windows. */
export function normalizeWindows(
  tr: TimeWindowsValue | null | undefined,
): Record<string, TimeWindow> {
  if (tr?.windows && Object.keys(tr.windows).length > 0) return tr.windows;
  if (tr?.days?.length) {
    return Object.fromEntries(
      tr.days.map((d) => [d, { start: tr.startTime ?? '09:00', end: tr.endTime ?? '18:00' }]),
    );
  }
  return {};
}

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
  return h * 60 + min;
}

/** The café-local weekday key + minutes-since-midnight for `now`. */
export function zonedDayAndMinutes(
  now: Date,
  timeZone: string = DEFAULT_TZ,
): { day: string; minutes: number } {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
  } catch {
    // Unknown timezone string → fall back to the default zone.
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone: DEFAULT_TZ,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
  }
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return {
    day: WEEKDAY_FROM_SHORT[weekday] ?? 'mon',
    minutes: (hour % 24) * 60 + minute,
  };
}

/**
 * True when `now` falls inside the configured windows.
 *
 * - restrictions disabled (or absent) → always true (no restriction)
 * - enabled but no days configured → always true (nothing to restrict by)
 * - enabled with days → only inside that weekday's window
 */
export function isWithinWindows(
  tr: TimeWindowsValue | null | undefined,
  now: Date,
  timeZone: string = DEFAULT_TZ,
): boolean {
  if (!tr?.enabled) return true;
  const windows = normalizeWindows(tr);
  if (Object.keys(windows).length === 0) return true;

  const { day, minutes } = zonedDayAndMinutes(now, timeZone);
  const win = windows[day];
  if (!win) return false;

  const start = toMinutes(win.start);
  const end = toMinutes(win.end);
  if (start === null || end === null) return true; // malformed → don't hide

  // Same-day window.
  if (end > start) return minutes >= start && minutes < end;
  // Crosses midnight (e.g. 22:00–02:00).
  return minutes >= start || minutes < end;
}
