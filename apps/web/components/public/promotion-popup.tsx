'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import { PromotionCarousel } from './promotion-carousel';

// T22.25 — when enabled, active promotions greet the visitor in a dismissible
// pop-up on menu open (once per browser session). The carousel inside reuses
// the same swipe / auto-advance / tap-to-expand behavior as the inline one.
interface PromotionPopupProps {
  menuId: string;
  // Reuse the carousel's promotion shape.
  promotions: React.ComponentProps<typeof PromotionCarousel>['promotions'];
  locale: Locale;
}

export function PromotionPopup({ menuId, promotions, locale }: PromotionPopupProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(`promo-popup-${menuId}`)) return;
    } catch {
      // sessionStorage unavailable (private mode) → still show once per mount.
    }
    setOpen(true);
  }, [menuId]);

  const dismiss = () => {
    try {
      sessionStorage.setItem(`promo-popup-${menuId}`, '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      data-testid="promotion-popup"
      onClick={dismiss}
    >
      <div className="relative w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          data-testid="promotion-popup-close"
          className="absolute -right-2 -top-2 z-10 rounded-full bg-white p-1.5 text-foreground shadow-md ring-1 ring-black/10 hover:bg-white/90"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="overflow-hidden rounded-2xl bg-background py-2 shadow-xl">
          <PromotionCarousel promotions={promotions} locale={locale} />
        </div>
      </div>
    </div>
  );
}
