'use client';

import Image from 'next/image';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';
import type { PublicProduct, PublicDisplaySettings } from './product-card';

interface FeaturedCarouselProps {
  products: PublicProduct[];
  locale: Locale;
  settings: PublicDisplaySettings;
}

const title: Record<Locale, string> = {
  ka: 'ხშირად შეკვეთილი',
  en: 'Most Ordered',
  ru: 'Часто заказывают',
};

function getName(p: PublicProduct, locale: Locale): string {
  switch (locale) {
    case 'en':
      return p.nameEn || p.nameKa;
    case 'ru':
      return p.nameRu || p.nameKa;
    default:
      return p.nameKa;
  }
}

function toNumber(v: number | string | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export function FeaturedCarousel({ products, locale, settings }: FeaturedCarouselProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-3" aria-label={title[locale]}>
      <div className="mx-auto max-w-2xl px-4">
        <h2 className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          <Flame className="h-3.5 w-3.5 text-muted-foreground/70" />
          {title[locale]}
        </h2>
      </div>
      <div className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
        {products.map((product) => {
          const price = toNumber(product.price);
          const oldPrice = product.oldPrice != null ? toNumber(product.oldPrice) : null;
          const showDiscount = settings.showDiscount && oldPrice && oldPrice > price;
          const focalX = product.imageFocalX ?? 0.5;
          const focalY = product.imageFocalY ?? 0.5;

          return (
            <a
              key={product.id}
              href={`#category-${product.id}`}
              onClick={(e) => {
                e.preventDefault();
                // Smooth-scroll to the category containing this product — but since
                // we don't have category ID here, fall back to anchor on product element
                const el = document.getElementById(`product-${product.id}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="group flex w-[170px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-square bg-muted">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={getName(product, locale)}
                    fill
                    className="object-cover"
                    style={{ objectPosition: `${focalX * 100}% ${focalY * 100}%` }}
                    sizes="170px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl text-muted-foreground">
                    🍽️
                  </div>
                )}
                {showDiscount && (
                  <span className="absolute top-1 right-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    -{Math.round(((oldPrice! - price) / oldPrice!) * 100)}%
                  </span>
                )}
              </div>
              <div className="p-2">
                <p className="line-clamp-2 text-xs font-medium leading-tight">
                  {getName(product, locale)}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={cn('text-sm font-semibold text-primary')}>
                    {price.toFixed(2)} {settings.currencySymbol}
                  </span>
                  {showDiscount && (
                    <span className="text-[10px] text-muted-foreground line-through">
                      {oldPrice!.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
