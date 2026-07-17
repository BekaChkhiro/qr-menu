'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';

// T22.21 — a time input the operator can read in either style.
//
// A native <input type="time"> always follows the browser/OS locale, so it can
// never honor an explicit "AM/PM (US) vs 24 Hour (EU)" choice. This renders the
// segments itself:
//   - value is ALWAYS the canonical 24h "HH:MM" string (storage never changes)
//   - `format` only affects presentation
//   - ArrowUp/ArrowDown step the focused segment (and the AM/PM toggle)
//   - typing two digits in the hour auto-advances to the minute
export type TimeFormat = 'H23' | 'H12';

interface TimeFieldProps {
  /** Canonical 24h "HH:MM". */
  value: string;
  onChange: (next: string) => void;
  format: TimeFormat;
  testId?: string;
  ariaLabel?: string;
}

function parse(value: string): { h: number; m: number } {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return { h: 9, m: 0 };
  return {
    h: Math.min(23, Math.max(0, Number(match[1]))),
    m: Math.min(59, Math.max(0, Number(match[2]))),
  };
}

const pad = (n: number) => String(n).padStart(2, '0');
const toValue = (h: number, m: number) => `${pad(h)}:${pad(m)}`;

export function TimeField({ value, onChange, format, testId, ariaLabel }: TimeFieldProps) {
  const { h, m } = parse(value);
  const minuteRef = useRef<HTMLInputElement>(null);

  const is12 = format === 'H12';
  const isPm = h >= 12;
  // 0 → 12am, 12 → 12pm
  const displayHour = is12 ? h % 12 || 12 : h;

  const setHour24 = (next: number) => onChange(toValue((next + 24) % 24, m));
  const setMinute = (next: number) => onChange(toValue(h, (next + 60) % 60));

  /** Convert a 12h display hour back to 24h, keeping the current meridiem. */
  const commitDisplayHour = (display: number, pm = isPm) => {
    if (!is12) {
      setHour24(Math.min(23, Math.max(0, display)));
      return;
    }
    const clamped = Math.min(12, Math.max(1, display));
    const h24 = (clamped % 12) + (pm ? 12 : 0);
    setHour24(h24);
  };

  const toggleMeridiem = () => onChange(toValue((h + 12) % 24, m));

  const segmentClass =
    'w-[2.2ch] bg-transparent text-center text-[13px] font-mono tabular-nums text-text-default outline-none';

  return (
    <div
      className="flex items-center gap-0.5"
      data-testid={testId}
      data-value={value}
      role="group"
      aria-label={ariaLabel}
    >
      {/* Hour */}
      <input
        type="text"
        inputMode="numeric"
        value={pad(displayHour)}
        aria-label="Hour"
        data-testid={testId ? `${testId}-hour` : undefined}
        className={segmentClass}
        onFocus={(e) => e.currentTarget.select()}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHour24(h + 1);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHour24(h - 1);
          }
        }}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(-2);
          if (digits === '') return;
          const n = Number(digits);
          commitDisplayHour(n);
          // Auto-advance to minutes once the hour can't take another digit.
          if (digits.length === 2 || n > (is12 ? 1 : 2)) minuteRef.current?.focus();
        }}
      />
      <span className="text-[13px] text-text-muted">:</span>
      {/* Minute */}
      <input
        ref={minuteRef}
        type="text"
        inputMode="numeric"
        value={pad(m)}
        aria-label="Minute"
        data-testid={testId ? `${testId}-minute` : undefined}
        className={segmentClass}
        onFocus={(e) => e.currentTarget.select()}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setMinute(m + 1);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setMinute(m - 1);
          }
        }}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(-2);
          if (digits === '') return;
          setMinute(Math.min(59, Number(digits)));
        }}
      />
      {/* Meridiem — AM/PM style only. Arrow keys flip it too. */}
      {is12 && (
        <button
          type="button"
          onClick={toggleMeridiem}
          data-testid={testId ? `${testId}-meridiem` : undefined}
          aria-label="AM or PM"
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
              toggleMeridiem();
            }
          }}
          className={cn(
            'ml-1 rounded px-1.5 py-0.5 text-[11px] font-bold uppercase',
            'bg-chip text-text-default hover:bg-border-soft',
          )}
        >
          {isPm ? 'PM' : 'AM'}
        </button>
      )}
    </div>
  );
}
