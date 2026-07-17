'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimeField, type TimeFormat } from './time-field';

// T22.21 — per-weekday time windows, shared by the promotion drawer and the
// product (dish) discount card so both author the same shape:
//   { mon: { start: '12:00', end: '14:00' }, tue: { start: '09:00', end: '11:00' } }
//
// The 24h ↔ AM/PM choice is an operator display preference (not a property of
// the menu), so it lives in localStorage and never changes what is stored.

export interface DayWindow {
  start: string;
  end: string;
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

interface DayWindowsEditorProps {
  value: DayWindows;
  onChange: (next: DayWindows) => void;
  /** Prefix for data-testids, e.g. "promotion" → promotion-day-toggle-mon. */
  testIdPrefix: string;
  /** Label shown on a day with no window. */
  inactiveLabel: string;
  /** Separator label between start and end (e.g. "to"). */
  toLabel: string;
}

export function DayWindowsEditor({
  value,
  onChange,
  testIdPrefix,
  inactiveLabel,
  toLabel,
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

  return (
    <div className="space-y-2" data-testid={`${testIdPrefix}-day-windows`}>
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

      {WEEK_DAYS.map((day) => {
        const win = value?.[day.key];
        const active = !!win;
        return (
          <div
            key={day.key}
            data-testid={`${testIdPrefix}-day-row-${day.key}`}
            data-active={active ? 'true' : 'false'}
            className={cn(
              'flex items-center gap-2.5 rounded-lg border p-2',
              active ? 'border-accent bg-card' : 'border-border',
            )}
          >
            <button
              type="button"
              onClick={() => setWindow(day.key, active ? null : { start: '09:00', end: '18:00' })}
              data-testid={`${testIdPrefix}-day-toggle-${day.key}`}
              data-active={active ? 'true' : 'false'}
              className={cn(
                'flex h-8 w-9 shrink-0 items-center justify-center rounded-md border text-[11.5px] font-semibold transition-colors',
                active
                  ? 'border-text-default bg-text-default text-white'
                  : 'border-border bg-card text-text-muted hover:bg-chip',
              )}
            >
              {day.label}
            </button>

            {active ? (
              <div className="flex flex-1 items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5">
                  <Clock className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.5} />
                  <TimeField
                    value={win!.start}
                    onChange={(start) => setWindow(day.key, { start, end: win!.end })}
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
                    onChange={(end) => setWindow(day.key, { start: win!.start, end })}
                    format={format}
                    testId={`${testIdPrefix}-day-end-${day.key}`}
                    ariaLabel={`${day.key} end`}
                  />
                </div>
              </div>
            ) : (
              <span className="flex-1 text-[12px] text-text-muted">{inactiveLabel}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
