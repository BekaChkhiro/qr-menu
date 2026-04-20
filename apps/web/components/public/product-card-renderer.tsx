'use client';

import type { Locale } from '@/i18n/config';
import type { MenuTemplate } from '@/types/menu';
import { ProductCard, type PublicProduct, type PublicDisplaySettings } from './product-card';
import { ProductCardMagazine } from './product-card-magazine';
import { ProductCardCompact } from './product-card-compact';

interface Props {
  product: PublicProduct;
  locale: Locale;
  settings: PublicDisplaySettings;
  template: MenuTemplate;
}

export function ProductCardRenderer({ product, locale, settings, template }: Props) {
  if (template === 'MAGAZINE') {
    return <ProductCardMagazine product={product} locale={locale} settings={settings} />;
  }
  if (template === 'COMPACT') {
    return <ProductCardCompact product={product} locale={locale} settings={settings} />;
  }
  return <ProductCard product={product} locale={locale} settings={settings} />;
}
