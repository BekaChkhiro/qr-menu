'use client';

import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

type Variant = 'overlay' | 'inline' | 'minimal';

interface DietaryBadgeProps {
  kind: 'VEGAN' | 'VEGETARIAN';
  variant?: Variant;
  locale: Locale;
  className?: string;
}

const labels = {
  VEGAN: {
    short: 'VG',
    full: { ka: 'ვეგანური', en: 'Vegan', ru: 'Веганское' },
  },
  VEGETARIAN: {
    short: 'V',
    full: { ka: 'ვეგეტარიანული', en: 'Vegetarian', ru: 'Вегетарианское' },
  },
} as const;

/**
 * Research-backed dietary marker (EU restaurant conventions):
 * - Vegan → "VG" in dark emerald
 * - Vegetarian → "V" in lighter emerald
 *
 * Avoids the ambiguity of a single "V" marker and is more accessible
 * than icon-only (screen readers can announce the letters).
 */
export function DietaryBadge({
  kind,
  variant = 'inline',
  locale,
  className,
}: DietaryBadgeProps) {
  const isVegan = kind === 'VEGAN';
  const short = labels[kind].short;
  const full = labels[kind].full[locale];

  // Colors — darker for vegan (more specific), lighter for vegetarian
  const colorClasses = isVegan
    ? 'bg-emerald-600 text-white ring-white/70'
    : 'bg-emerald-50 text-emerald-700 ring-emerald-200';

  if (variant === 'overlay') {
    // For placement on product image (white ring for contrast)
    return (
      <span
        title={full}
        aria-label={full}
        className={cn(
          'inline-flex h-7 min-w-[28px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold shadow-sm ring-2',
          isVegan ? 'bg-emerald-600 text-white ring-white/90' : 'bg-white text-emerald-700 ring-emerald-200',
          className
        )}
      >
        {short}
      </span>
    );
  }

  if (variant === 'minimal') {
    // Tiny text-only for compact template
    return (
      <span
        title={full}
        aria-label={full}
        className={cn(
          'inline-flex items-center justify-center rounded-sm px-1 text-[9px] font-bold leading-tight',
          isVegan ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700',
          className
        )}
      >
        {short}
      </span>
    );
  }

  // inline (default): small chip with letter
  return (
    <span
      title={full}
      aria-label={full}
      className={cn(
        'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ring-1 ring-inset',
        colorClasses,
        className
      )}
    >
      {short}
    </span>
  );
}
