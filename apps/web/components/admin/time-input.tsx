'use client';

import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// Native <input type="time"> styled like the business hours form. The browser or
// OS locale decides 24h / AM-PM display; the value is always the canonical 24h
// "HH:MM" string, so storage never changes.
export function TimeInput({
  value,
  onChange,
  testId,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  testId: string;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5',
        className,
      )}
    >
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
