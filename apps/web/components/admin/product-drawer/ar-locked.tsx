'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Box, Lock, Sparkles } from 'lucide-react';

// Mirrors the active AR tab preview pad (product-drawer-ar-tab.tsx lines
// 130–155): a soft radial-gradient pad with a 3D-cube icon. Rendered blurred
// and non-interactive behind the upgrade overlay so STARTER/FREE users can
// see the shape of the feature without reaching it.
export function ArLocked() {
  const t = useTranslations('admin.products.drawer.arLocked');

  return (
    <div
      className="relative min-h-[420px] w-full"
      data-testid="product-drawer-ar-locked"
    >
      {/* Blurred preview behind the overlay. Non-interactive & hidden from
          assistive tech. */}
      <div
        className="pointer-events-none select-none opacity-50 blur-[4px]"
        aria-hidden="true"
        data-testid="product-drawer-ar-locked-preview"
      >
        <div className="flex h-[260px] w-full items-center justify-center rounded-[10px] border border-border bg-[radial-gradient(circle_at_center,_#FAF7F1_0%,_#EDE7DA_100%)]">
          <Box className="h-12 w-12 text-text-subtle" strokeWidth={1.4} />
        </div>
      </div>

      {/* Centered upgrade card. */}
      <div
        className={
          'absolute left-1/2 top-1/2 w-[340px] max-w-full -translate-x-1/2 -translate-y-1/2 ' +
          'rounded-[12px] border border-border bg-card px-[22px] py-[22px] text-center ' +
          'shadow-[0_10px_40px_rgba(0,0,0,0.08)]'
        }
        data-testid="product-drawer-ar-locked-overlay"
        role="group"
        aria-labelledby="ar-locked-title"
      >
        <div
          className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent-soft text-accent"
          aria-hidden="true"
        >
          <Lock className="h-[17px] w-[17px]" strokeWidth={1.8} />
        </div>
        <div
          id="ar-locked-title"
          className="mb-1.5 text-[15px] font-semibold leading-tight tracking-[-0.2px] text-text-default"
        >
          {t('title')}
        </div>
        <p className="mb-4 text-[12.5px] leading-[1.55] text-text-muted">
          {t('body')}
        </p>

        <Link
          href="/admin/settings/billing"
          data-testid="product-drawer-ar-locked-cta"
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
