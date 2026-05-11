'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface CategoryAvatarProps {
  iconUrl?: string | null;
  name: string;
  /** Pixel size of the avatar (used for both width/height and font scaling). */
  size?: number;
  /** Hex color used to tint the fallback background; falls back to a neutral token. */
  accentColor?: string | null;
  className?: string;
  /**
   * When provided, used as the testid root so consumers (admin list, public
   * section header, T21.11 banner) can target it consistently.
   */
  testId?: string;
}

function firstGlyph(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return [...trimmed][0]?.toUpperCase() ?? '?';
}

/**
 * Avatar for a Category. Renders the uploaded `iconUrl` when present,
 * otherwise a circular letter badge using the first character of `name`
 * on a 10% tint of `accentColor`. Both shapes share size + radius so the
 * surrounding layout doesn't shift on icon presence/absence (T21.7).
 */
export function CategoryAvatar({
  iconUrl,
  name,
  size = 24,
  accentColor,
  className,
  testId = 'category-avatar',
}: CategoryAvatarProps) {
  const dim: CSSProperties = { width: size, height: size };

  if (iconUrl) {
    return (
      <span
        className={cn('relative inline-block shrink-0 overflow-hidden rounded-full bg-chip', className)}
        style={dim}
        data-testid={testId}
        data-icon-kind="image"
      >
        <Image
          src={iconUrl}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      </span>
    );
  }

  // Letter-badge fallback: tinted bg + tinted text. When no accentColor is
  // provided we fall back to the design system `chip` background so the
  // badge stays visible in any admin theme.
  const bg = accentColor
    ? `color-mix(in srgb, ${accentColor} 12%, transparent)`
    : undefined;
  const fg = accentColor ?? undefined;
  const fontSize = Math.max(10, Math.round(size * 0.5));

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold uppercase leading-none tracking-tight',
        accentColor ? '' : 'bg-chip text-text-default',
        className,
      )}
      style={{ ...dim, background: bg, color: fg, fontSize }}
      data-testid={testId}
      data-icon-kind="letter"
      aria-hidden="true"
    >
      {firstGlyph(name)}
    </span>
  );
}
