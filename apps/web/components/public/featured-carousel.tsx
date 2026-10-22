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

// T2.4 — the client prefers the original "Most ordered" label (2026-10-22 #11).
// The rail is still hand-picked or ribbon-driven; nothing counts orders.
const title: Record<Locale, string> = {
  ka: 'ხშირად შეკვეთილი',
  en: 'Most ordered',
  ru: 'Часто заказывают',
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
