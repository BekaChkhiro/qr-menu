'use client';

import { cn } from '@/lib/utils';

interface PriceTagProps {
  value: number;
  symbol: string;
  /** Text size class for the number (e.g., "text-[18px]"). */
  size?: string;
  /** Font weight class for the number. */
  weight?: string;
  /** Color class for the number. */
  color?: string;
  /** Text size class for the currency symbol (typically 1-2 steps smaller). */
  symbolSize?: string;
  className?: string;
}

/**
 * Research-based price display: number dominant, currency subtle.
 *
 * Cornell (Yang et al. 2009) showed that emphasizing the currency symbol
 * reduces spend (~8% penalty). Numerical value should be the visual anchor;
 * the symbol is supportive context.
 */
export function PriceTag({
  value,
  symbol,
  size = 'text-[15.5px]',
  weight = 'font-semibold',
  color = 'text-foreground',
  symbolSize = 'text-[11px]',
  className,
}: PriceTagProps) {
  return (
    <span
      className={cn('inline-flex items-baseline gap-0.5 whitespace-nowrap', className)}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      <span className={cn(size, weight, color)}>{value.toFixed(2)}</span>
      <span className={cn(symbolSize, 'font-normal text-muted-foreground')}>
        {symbol}
      </span>
    </span>
  );
}

/**
 * Strikethrough old-price variant.
 */
export function OldPriceTag({
  value,
  symbol,
  className,
}: {
  value: number;
  symbol: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-baseline gap-0.5 whitespace-nowrap text-muted-foreground line-through',
        className
      )}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      <span className="text-[11px]">{value.toFixed(2)}</span>
      <span className="text-[9.5px]">{symbol}</span>
    </span>
  );
}
