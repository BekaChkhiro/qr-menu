'use client';

import Image from 'next/image';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';
import type { PublicProduct, PublicDisplaySettings } from './product-card';
import { requestCategoryJump } from './jump-to-category';

// T24.18 — the horizontally-scrolling product rail that sits above the menu
// body. Two of them exist: "Most Ordered" (ribbon-driven) and "Offers" (the
// combo-generated category). They are pixel-identical by design — the report
// asked for the Offers rail to look exactly like the Most Ordered one — so the
// markup lives here once and each rail only supplies its heading and data.

interface ProductRailProps {
  products: PublicProduct[];
  locale: Locale;
  settings: PublicDisplaySettings;
  title: string;
  icon: LucideIcon;
  /**
   * Optional "see all" affordance. `seeAllCategoryId` is the category this rail
   * mirrors; clicking reveals and scrolls to that section instead of navigating,
   * so the visitor never loses their place in the menu.
   */
  seeAllLabel?: string;
  seeAllCategoryId?: string;
  'data-testid'?: string;
}

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

export function ProductRail({
  products,
  locale,
  settings,
  title,
  icon: Icon,
  seeAllLabel,
  seeAllCategoryId,
  'data-testid': testId,
}: ProductRailProps) {
  if (products.length === 0) return null;

  const showSeeAll = Boolean(seeAllLabel && seeAllCategoryId);

  return (
    <section className="py-3" aria-label={title} data-testid={testId}>
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4">
        <h2 className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          <Icon className="h-3.5 w-3.5 text-muted-foreground/70" />
          {title}
        </h2>
        {showSeeAll && (
          <a
            href={`#category-${seeAllCategoryId}`}
            data-testid={testId ? `${testId}-see-all` : undefined}
            onClick={(e) => {
              e.preventDefault();
              // MenuBody reveals the section itself when it is listening; the
              // scroll below is only for pages that render sections directly.
              if (requestCategoryJump(seeAllCategoryId!)) return;
              document
                .getElementById(`category-${seeAllCategoryId}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="mb-2 inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-[var(--menu-accent)] transition-opacity hover:opacity-70"
          >
            {seeAllLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </a>
        )}
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
              href={`#product-${product.id}`}
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById(`product-${product.id}`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="group flex w-[170px] shrink-0 snap-start flex-col overflow-hidden rounded-[var(--menu-radius-card)] border bg-card shadow-sm transition-shadow hover:shadow-md"
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
                  <span className={cn('text-sm font-semibold text-[var(--menu-accent)]')}>
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
