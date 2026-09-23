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
  // T24.4 — optional mid-day break carved out of [start, end): the venue is
  // shut 15:00–17:00, so an offer running 09:00–23:00 must pause then too.
  breakStart?: string | null;
  breakEnd?: string | null;
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

  // Same-day window, or one that crosses midnight (e.g. 22:00–02:00).
  const inWindow =
    end > start ? minutes >= start && minutes < end : minutes >= start || minutes < end;
  if (!inWindow) return false;

  return !isInBreak(win, minutes);
}

/** True when `minutes` falls inside the window's optional break. */
function isInBreak(win: TimeWindow, minutes: number): boolean {
  if (!win.breakStart || !win.breakEnd) return false;
  const bStart = toMinutes(win.breakStart);
  const bEnd = toMinutes(win.breakEnd);
  if (bStart === null || bEnd === null || bStart === bEnd) return false;
  return bEnd > bStart
    ? minutes >= bStart && minutes < bEnd
    : minutes >= bStart || minutes < bEnd;
}

// ── Validity dates (T24.1) ──────────────────────────────────────────────────
//
// startDate / endDate are optional. A missing boundary means "no boundary":
// a promotion with neither date runs from the moment it is switched on until
// the owner switches it off.

export interface PromotionDates {
  startDate?: Date | string | null;
  endDate?: Date | string | null;
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// ── Whole-day boundaries (T24.14) ───────────────────────────────────────────
//
// The drawer authors dates with `<input type="date">`, which yields a bare
// "YYYY-MM-DD". Parsing that gives UTC midnight — 04:00 in Tbilisi. Compared
// instant-to-instant, "ends today" therefore expired at 04:00 this morning and
// "starts today" did not begin until 04:00, which is why an operator had to
// pick YESTERDAY to get a promotion running right now.
//
// An operator picking a day means the whole of that day. So instead of
// comparing instants we compare against the café-local DAY that `now` falls in:
//
//   started    ⟺ startDate <= end of today   (café-local)
//   not ended  ⟺ endDate   >= start of today (café-local)
//
// Deriving the bounds from `now` rather than from the stored value keeps this
// robust no matter what time-of-day a row happens to carry (UTC midnight,
// café midnight, or a legacy mid-day timestamp) — every instant that lands
// anywhere inside the intended day compares the same way.

/** The zone's UTC offset, in ms, at `date`. */
function tzOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  // formatToParts drops sub-second precision, so compare on whole seconds.
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

function dayBounds(now: Date, timeZone: string): { start: number; end: number } {
  let offset: number;
  try {
    offset = tzOffsetMs(now, timeZone);
  } catch {
    offset = tzOffsetMs(now, DEFAULT_TZ);
  }

  // Shift into the zone's wall clock, truncate to the day, shift back.
  const wall = now.getTime() + offset;
  const startOfWallDay = Math.floor(wall / 86_400_000) * 86_400_000;
  return {
    start: startOfWallDay - offset,
    end: startOfWallDay + 86_400_000 - 1 - offset,
  };
}

/** True when `now` sits inside the (possibly open-ended) validity window. */
export function isWithinDateRange(
  p: PromotionDates,
  now: Date = new Date(),
  timeZone: string = DEFAULT_TZ,
): boolean {
  return !isScheduled(p, now, timeZone) && !hasEnded(p, now, timeZone);
}

/** True when the promotion has not started yet (dated promotions only). */
export function isScheduled(
  p: PromotionDates,
  now: Date = new Date(),
  timeZone: string = DEFAULT_TZ,
): boolean {
  const start = toDate(p.startDate);
  if (!start) return false;
  return start.getTime() > dayBounds(now, timeZone).end;
}

/** True when the promotion's end date has passed (dated promotions only). */
export function hasEnded(
  p: PromotionDates,
  now: Date = new Date(),
  timeZone: string = DEFAULT_TZ,
): boolean {
  const end = toDate(p.endDate);
  if (!end) return false;
  return end.getTime() < dayBounds(now, timeZone).start;
}

/** Prisma `where` fragment for "not expired" (open-ended rows included). */
export function notExpiredWhere(now: Date = new Date(), timeZone: string = DEFAULT_TZ) {
  const { start } = dayBounds(now, timeZone);
  return { OR: [{ endDate: null }, { endDate: { gte: new Date(start) } }] };
}
