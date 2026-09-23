'use client';

import { Tag } from 'lucide-react';
import { ProductRail } from './product-rail';
import type { Locale } from '@/i18n/config';
import type { PublicProduct, PublicDisplaySettings } from './product-card';

// T24.18 — the Promotions V2 report asked for the combo "Offers" category to
// appear twice: once as a horizontal rail near the top, styled exactly like
// "Most Ordered" and carrying a "see all" shortcut, and once as the last
// category in the menu body (that part is T24.8). This is the rail half.

interface OffersCarouselProps {
  /** Products of the auto-managed Offers category. */
  products: PublicProduct[];
  /** Id of that category, so "see all" can scroll to its section. */
  categoryId: string;
  locale: Locale;
  settings: PublicDisplaySettings;
}

// Mirrors the category names the combo builder writes (lib/promotions/combo.ts).
const title: Record<Locale, string> = {
  ka: 'შეთავაზება',
  en: 'Offers',
  ru: 'Предложения',
};

const seeAll: Record<Locale, string> = {
  ka: 'სრულიად',
  en: 'See all',
  ru: 'Все',
};

export function OffersCarousel({
  products,
  categoryId,
  locale,
  settings,
}: OffersCarouselProps) {
  return (
    <ProductRail
      products={products}
      locale={locale}
      settings={settings}
      title={title[locale]}
      icon={Tag}
      seeAllLabel={seeAll[locale]}
      seeAllCategoryId={categoryId}
      data-testid="offers-carousel"
    />
  );
}
