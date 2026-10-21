'use client';

import { Flame } from 'lucide-react';
import { ProductRail } from './product-rail';
import type { Locale } from '@/i18n/config';
import type { PublicProduct, PublicDisplaySettings } from './product-card';

interface FeaturedCarouselProps {
  products: PublicProduct[];
  locale: Locale;
  settings: PublicDisplaySettings;
}

// T1.11 — renamed from "Most Ordered": the rail is hand-picked or ribbon-driven,
// nothing counts orders.
const title: Record<Locale, string> = {
  ka: 'რეკომენდებული',
  en: 'Recommended',
  ru: 'Рекомендуем',
};

export function FeaturedCarousel({ products, locale, settings }: FeaturedCarouselProps) {
  return (
    <ProductRail
      products={products}
      locale={locale}
      settings={settings}
      title={title[locale]}
      icon={Flame}
      data-testid="featured-carousel"
    />
  );
}
