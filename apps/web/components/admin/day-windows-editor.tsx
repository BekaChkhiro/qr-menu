'use client';

import { useEffect, useState } from 'react';
import { Clock, Coffee, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimeField, type TimeFormat } from './time-field';
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
// The 24h ↔ AM/PM choice is an operator display preference (not a property of
// the menu), so it lives in localStorage and never changes what is stored.

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

const FORMAT_STORAGE_KEY = 'dm-admin-time-format';

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
  const [format, setFormat] = useState<TimeFormat>('H23');

  // Restore the operator's preferred style.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FORMAT_STORAGE_KEY);
      if (stored === 'H12' || stored === 'H23') setFormat(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const chooseFormat = (next: TimeFormat) => {
    setFormat(next);
    try {
      localStorage.setItem(FORMAT_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

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
      <div className="flex flex-wrap items-center gap-2">
        {/* 24h ↔ AM/PM style toggle */}
        <div
          className="inline-flex rounded-md border border-border p-0.5"
          data-testid={`${testIdPrefix}-time-format`}
        >
          {(
            [
              { key: 'H23', label: '24h' },
              { key: 'H12', label: 'AM/PM' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => chooseFormat(opt.key)}
              data-testid={`${testIdPrefix}-time-format-${opt.key}`}
              data-active={format === opt.key ? 'true' : 'false'}
              className={cn(
                'rounded px-2 py-0.5 text-[11px] font-semibold transition-colors',
                format === opt.key ? 'bg-text-default text-white' : 'text-text-muted hover:bg-chip',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* T24.4 — snap every day back to the venue's opening hours. */}
        {venueHoursAvailable && (
          <button
            type="button"
            onClick={() => onChange(defaultDayWindows(workingHours))}
            data-testid={`${testIdPrefix}-use-venue-hours`}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-text-muted transition-colors hover:bg-chip"
          >
            <Clock className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
            {useVenueHoursLabel}
          </button>
        )}
      </div>

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
                  <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5">
                    <Clock className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.5} />
                    <TimeField
                      value={win!.start}
                      onChange={(start) => patchWindow(day.key, { start })}
                      format={format}
                      testId={`${testIdPrefix}-day-start-${day.key}`}
                      ariaLabel={`${day.key} start`}
                    />
                  </div>
                  <span className="text-[12px] text-text-muted">{toLabel}</span>
                  <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5">
                    <Clock className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.5} />
                    <TimeField
                      value={win!.end}
                      onChange={(end) => patchWindow(day.key, { end })}
                      format={format}
                      testId={`${testIdPrefix}-day-end-${day.key}`}
                      ariaLabel={`${day.key} end`}
                    />
                  </div>
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
                <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5">
                  <TimeField
                    value={win!.breakStart!}
                    onChange={(breakStart) => patchWindow(day.key, { breakStart })}
                    format={format}
                    testId={`${testIdPrefix}-day-break-start-${day.key}`}
                    ariaLabel={`${day.key} break start`}
                  />
                </div>
                <span className="text-[12px] text-text-muted">{toLabel}</span>
                <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5">
                  <TimeField
                    value={win!.breakEnd!}
                    onChange={(breakEnd) => patchWindow(day.key, { breakEnd })}
                    format={format}
                    testId={`${testIdPrefix}-day-break-end-${day.key}`}
                    ariaLabel={`${day.key} break end`}
                  />
                </div>
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
