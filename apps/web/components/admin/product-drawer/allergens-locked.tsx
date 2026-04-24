'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Bean,
  Egg,
  Fish,
  Lock,
  Milk,
  Nut,
  Sparkles,
  Wheat,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Mini preview grid: first 6 tiles of the 8-tile Allergens tab, rendered in an
// inactive state. Matches the design reference (product-drawer.jsx lines
// 543–549) which shows a blurred, non-interactive 6-tile peek behind the
// upgrade overlay.
const PREVIEW_TILES: Array<{ key: string; icon: LucideIcon; labelKey: string }> = [
  { key: 'gluten', icon: Wheat, labelKey: 'tiles.gluten' },
  { key: 'dairy', icon: Milk, labelKey: 'tiles.dairy' },
  { key: 'eggs', icon: Egg, labelKey: 'tiles.eggs' },
  { key: 'nuts', icon: Nut, labelKey: 'tiles.nuts' },
  { key: 'seafood', icon: Fish, labelKey: 'tiles.seafood' },
  { key: 'soy', icon: Bean, labelKey: 'tiles.soy' },
];

export function AllergensLocked() {
  const t = useTranslations('admin.products.drawer.allergensLocked');
  const tTiles = useTranslations('admin.products.drawer.allergensTab');

  return (
    <div
      className="relative min-h-[420px] w-full"
      data-testid="product-drawer-allergens-locked"
    >
      {/* Blurred 6-tile preview behind the overlay. Non-interactive & hidden
          from assistive tech so STARTER users can't reach the tiles. */}
      <div
        className="pointer-events-none select-none opacity-50 blur-[4px]"
        aria-hidden="true"
        data-testid="product-drawer-allergens-locked-preview"
      >
        <div className="grid grid-cols-2 gap-2">
          {PREVIEW_TILES.map(({ key, icon: Icon, labelKey }) => (
            <div
              key={key}
              className="flex items-center gap-2.5 rounded-[10px] border border-border bg-card px-3.5 py-3"
            >
              <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[7px] bg-chip text-text-muted">
                <Icon className="h-[15px] w-[15px]" strokeWidth={1.8} />
              </div>
              <span className="flex-1 truncate text-[12.5px] font-semibold text-text-default">
                {tTiles(labelKey)}
              </span>
              <div
                className="h-[18px] w-[30px] rounded-full border border-border bg-chip"
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Centered upgrade card. */}
      <div
        className={
          'absolute left-1/2 top-1/2 w-[340px] max-w-full -translate-x-1/2 -translate-y-1/2 ' +
          'rounded-[12px] border border-border bg-card px-[22px] py-[22px] text-center ' +
          'shadow-[0_10px_40px_rgba(0,0,0,0.08)]'
        }
        data-testid="product-drawer-allergens-locked-overlay"
        role="group"
        aria-labelledby="allergens-locked-title"
      >
        <div
          className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent-soft text-accent"
          aria-hidden="true"
        >
          <Lock className="h-[17px] w-[17px]" strokeWidth={1.8} />
        </div>
        <div
          id="allergens-locked-title"
          className="mb-1.5 text-[15px] font-semibold leading-tight tracking-[-0.2px] text-text-default"
        >
          {t('title')}
        </div>
        <p className="mb-4 text-[12.5px] leading-[1.55] text-text-muted">
          {t('body')}
        </p>

        <Link
          href="/admin/settings/billing"
          data-testid="product-drawer-allergens-locked-cta"
          className={
            'inline-flex h-[32px] w-full items-center justify-center gap-[6px] rounded-[7px] ' +
            'border border-text-default bg-text-default px-[13px] text-[12.5px] font-medium text-white ' +
            'transition-colors hover:bg-text-default/90 active:bg-text-default/80 ' +
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2'
          }
        >
          <Sparkles size={13} strokeWidth={1.5} aria-hidden="true" />
          {t('cta')}
        </Link>
      </div>
    </div>
  );
}
