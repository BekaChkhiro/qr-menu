'use client';

import { Clock, Coffee, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  WEEKDAY_KEYS,
  workingHoursToWindows,
  hasWorkingHours,
  type WorkingHoursDay,
} from '@/lib/menu/working-hours';

// T22.21 — per-weekday time windows, shared by the promotion drawer and the
// product (dish) discount card so both author the same shape:
//   { mon: { start: '12:00', end: '14:00' }, tue: { start: '09:00', end: '11:00' } }
//
// T24.3 — every day starts switched ON (green border). Switching a day off
// turns its row red: "the offer does NOT run this day". T24.4 — each active day
// can also carve out a mid-day break (venue shut 15:00–17:00).
//
// Times are edited with native <input type="time"> (same as the business hours
// form), so the 24h / AM-PM display follows the browser locale. Storage is
// always the canonical 24h "HH:MM" string.

export interface DayWindow {
  start: string;
  end: string;
  breakStart?: string | null;
  breakEnd?: string | null;
}
export type DayWindows = Record<string, DayWindow>;

const WEEK_DAYS = [
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'T' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'T' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'S' },
  { key: 'sun', label: 'S' },
] as const;

const FALLBACK_WINDOW: DayWindow = { start: '09:00', end: '18:00' };
const DEFAULT_BREAK = { breakStart: '15:00', breakEnd: '17:00' };

/**
 * T24.3/T24.4 — the windows a freshly-enabled restriction starts from: every
 * weekday on, pre-filled from the venue's working hours when the owner has set
 * them (closed days stay off), otherwise a plain 09:00–18:00.
 */
export function defaultDayWindows(workingHours?: WorkingHoursDay[] | null): DayWindows {
  if (hasWorkingHours(workingHours)) {
    const fromHours = workingHoursToWindows(workingHours);
    return Object.fromEntries(
      Object.entries(fromHours).map(([day, w]) => [
        day,
        {
          start: w.start,
          end: w.end,
          breakStart: w.breakStart ?? null,
          breakEnd: w.breakEnd ?? null,
        },
      ]),
    );
  }
  return Object.fromEntries(WEEKDAY_KEYS.map((day) => [day, { ...FALLBACK_WINDOW }]));
}

interface DayWindowsEditorProps {
  value: DayWindows;
  onChange: (next: DayWindows) => void;
  /** Prefix for data-testids, e.g. "promotion" → promotion-day-toggle-mon. */
  testIdPrefix: string;
  /** Label shown on a day with no window. */
  inactiveLabel: string;
  /** Separator label between start and end (e.g. "to"). */
  toLabel: string;
  /** T24.4 — venue hours; enables the "use venue hours" shortcut. */
  workingHours?: WorkingHoursDay[] | null;
  /** Label for the "add a break" action. */
  addBreakLabel?: string;
  /** Label for the break time range. */
  breakLabel?: string;
  /** Label for the "reset to venue hours" action. */
  useVenueHoursLabel?: string;
}

/** Native time input, styled like the business hours form. Value is 24h "HH:MM". */
function TimeInput({
  value,
  onChange,
  testId,
  ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  testId: string;
  ariaLabel: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5">
      <Clock className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.5} aria-hidden="true" />
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        data-testid={testId}
        className="rounded-[6px] border border-border bg-[#FAFAF9] px-[10px] py-[4px] text-[12.5px] text-text-default tabular-nums focus:border-text-default focus:outline-none"
      />
    </div>
  );
}

export function DayWindowsEditor({
  value,
  onChange,
  testIdPrefix,
  inactiveLabel,
  toLabel,
  workingHours,
  addBreakLabel = 'Add break',
  breakLabel = 'Break',
  useVenueHoursLabel = 'Use venue hours',
}: DayWindowsEditorProps) {
  const setWindow = (day: string, next: DayWindow | null) => {
    const draft = { ...value };
    if (next) draft[day] = next;
    else delete draft[day];
    onChange(draft);
  };

  const patchWindow = (day: string, patch: Partial<DayWindow>) => {
    const current = value?.[day];
    if (!current) return;
    setWindow(day, { ...current, ...patch });
  };

  // A day that was switched off has no stored window — restore it from the
  // venue hours for that day when we can, so the operator doesn't retype them.
  const venueWindows = workingHoursToWindows(workingHours);
  const restoreWindow = (day: string): DayWindow => {
    const venue = venueWindows[day];
    if (venue) {
      return {
        start: venue.start,
        end: venue.end,
        breakStart: venue.breakStart ?? null,
        breakEnd: venue.breakEnd ?? null,
      };
    }
    return { ...FALLBACK_WINDOW };
  };

  const venueHoursAvailable = hasWorkingHours(workingHours);

  return (
    <div className="space-y-2" data-testid={`${testIdPrefix}-day-windows`}>
      {/* T24.4 — snap every day back to the venue's opening hours. */}
      {venueHoursAvailable && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onChange(defaultDayWindows(workingHours))}
            data-testid={`${testIdPrefix}-use-venue-hours`}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-text-muted transition-colors hover:bg-chip"
          >
            <Clock className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
            {useVenueHoursLabel}
          </button>
        </div>
      )}

      {WEEK_DAYS.map((day) => {
        const win = value?.[day.key];
        const active = !!win;
        const hasBreak = !!(win?.breakStart && win?.breakEnd);
        return (
          <div
            key={day.key}
            data-testid={`${testIdPrefix}-day-row-${day.key}`}
            data-active={active ? 'true' : 'false'}
            className={cn(
              'flex flex-col gap-2 rounded-lg border p-2',
              // T24.3 — on = green, off = red. The colour IS the state here.
              active ? 'border-success bg-card' : 'border-danger bg-danger-soft/40',
            )}
          >
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setWindow(day.key, active ? null : restoreWindow(day.key))}
                data-testid={`${testIdPrefix}-day-toggle-${day.key}`}
                data-active={active ? 'true' : 'false'}
                className={cn(
                  'flex h-8 w-9 shrink-0 items-center justify-center rounded-md border text-[11.5px] font-semibold transition-colors',
                  active
                    ? 'border-success bg-success text-white'
                    : 'border-danger bg-card text-danger hover:bg-danger-soft',
                )}
              >
                {day.label}
              </button>

              {active ? (
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <TimeInput
                    value={win!.start}
                    onChange={(start) => patchWindow(day.key, { start })}
                    testId={`${testIdPrefix}-day-start-${day.key}`}
                    ariaLabel={`${day.key} start`}
                  />
                  <span className="text-[12px] text-text-muted">{toLabel}</span>
                  <TimeInput
                    value={win!.end}
                    onChange={(end) => patchWindow(day.key, { end })}
                    testId={`${testIdPrefix}-day-end-${day.key}`}
                    ariaLabel={`${day.key} end`}
                  />
                  {!hasBreak && (
                    <button
                      type="button"
                      onClick={() => patchWindow(day.key, DEFAULT_BREAK)}
                      data-testid={`${testIdPrefix}-day-add-break-${day.key}`}
                      className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-[11px] font-medium text-text-muted transition-colors hover:bg-chip"
                    >
                      <Coffee className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
                      {addBreakLabel}
                    </button>
                  )}
                </div>
              ) : (
                <span className="flex-1 text-[12px] font-medium text-danger">{inactiveLabel}</span>
              )}
            </div>

            {/* T24.4 — optional mid-day break carved out of the day's window. */}
            {active && hasBreak && (
              <div
                className="flex flex-wrap items-center gap-2 pl-[46px]"
                data-testid={`${testIdPrefix}-day-break-${day.key}`}
              >
                <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-text-muted">
                  <Coffee className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
                  {breakLabel}
                </span>
                <TimeInput
                  value={win!.breakStart!}
                  onChange={(breakStart) => patchWindow(day.key, { breakStart })}
                  testId={`${testIdPrefix}-day-break-start-${day.key}`}
                  ariaLabel={`${day.key} break start`}
                />
                <span className="text-[12px] text-text-muted">{toLabel}</span>
                <TimeInput
                  value={win!.breakEnd!}
                  onChange={(breakEnd) => patchWindow(day.key, { breakEnd })}
                  testId={`${testIdPrefix}-day-break-end-${day.key}`}
                  ariaLabel={`${day.key} break end`}
                />
                <button
                  type="button"
                  onClick={() => patchWindow(day.key, { breakStart: null, breakEnd: null })}
                  data-testid={`${testIdPrefix}-day-remove-break-${day.key}`}
                  aria-label={`${day.key} remove break`}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-chip hover:text-danger"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
