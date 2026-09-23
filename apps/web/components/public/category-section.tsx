'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';
import type { MenuTemplate } from '@/types/menu';
import { type PublicProduct, type PublicDisplaySettings } from './product-card';
import { ProductCardRenderer } from './product-card-renderer';

interface Category {
  id: string;
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
  descriptionKa: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  brandLabel?: string | null;
  iconUrl?: string | null;
  products: PublicProduct[];
}

interface CategorySectionProps {
  category: Category;
  locale: Locale;
  index?: number;
  settings: PublicDisplaySettings;
  template?: MenuTemplate;
}

function getCategoryName(category: Category, locale: Locale): string {
  switch (locale) {
    case 'en':
      return category.nameEn || category.nameKa;
    case 'ru':
      return category.nameRu || category.nameKa;
    default:
      return category.nameKa;
  }
}

function getCategoryDescription(category: Category, locale: Locale): string | null {
  switch (locale) {
    case 'en':
      return category.descriptionEn || category.descriptionKa;
    case 'ru':
      return category.descriptionRu || category.descriptionKa;
    default:
      return category.descriptionKa;
  }
}

interface BannerProps {
  /** T24.5 — required: a category with no image renders no banner at all. */
  iconUrl: string;
  name: string;
  brandLabel?: string | null;
  template: MenuTemplate;
  headingId: string;
  productCount: number;
  productCountLabel: string;
}

function CategoryBannerHeader({
  iconUrl,
  name,
  brandLabel,
  template,
  headingId,
  productCount,
  productCountLabel,
}: BannerProps) {
  const isCompact = template === 'COMPACT';

  return (
    <div
      className={cn(
        'relative mb-4 overflow-hidden rounded-xl',
        isCompact ? 'h-[120px] sm:h-[160px]' : 'h-[140px] sm:h-[180px] md:h-[240px]',
      )}
      data-testid="category-banner"
    >
      <Image
        src={iconUrl}
        alt=""
        fill
        sizes="(max-width: 672px) 100vw, 672px"
        className="object-cover"
        aria-hidden
      />

      {/* Bottom-up gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Name + count overlay */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-3 py-2.5">
        <div className="min-w-0">
          {brandLabel && (
            <div className="mb-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.15em] text-white/70">
              {brandLabel}
            </div>
          )}
          <h2
            id={headingId}
            className={cn(
              'truncate font-bold leading-tight text-white drop-shadow-sm',
              isCompact ? 'text-base' : 'text-xl',
            )}
            style={{ fontFamily: 'var(--heading-font)' }}
          >
            {name}
          </h2>
        </div>
        <span
          className="ml-3 shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm"
          aria-label={`${productCount} ${productCountLabel}`}
        >
          {productCount}
        </span>
      </div>
    </div>
  );
}

export function CategorySection({
  category,
  locale,
  index = 0,
  settings,
  template = 'CLASSIC',
}: CategorySectionProps) {
  const name = getCategoryName(category, locale);
  const description = getCategoryDescription(category, locale);
  const productCount = category.products.length;

  const productCountLabel =
    locale === 'ka' ? 'პროდუქტი' : locale === 'ru' ? 'продукт' : 'products';

  // Per-template product list container
  const listClass =
    template === 'MAGAZINE'
      ? 'space-y-6'
      : template === 'COMPACT'
      ? 'rounded-[var(--menu-radius-card)] bg-card ring-1 ring-border/60 overflow-hidden px-3'
      : 'space-y-3';

  const sectionTopPadding =
    template === 'MAGAZINE' ? (index === 0 ? 'pt-10' : 'pt-12') : index === 0 ? 'pt-6' : 'pt-2';

  return (
    <section
      id={`category-${category.id}`}
      className={cn('scroll-mt-36 animate-fade-in', sectionTopPadding)}
      style={{ animationDelay: `${index * 100}ms` }}
      aria-labelledby={`category-heading-${category.id}`}
      role="tabpanel"
    >
      {template === 'MAGAZINE' ? (
        // ── Magazine: centered, serif, decorative ──
        <div className="mb-6 text-center">
          {category.brandLabel && (
            <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
              {category.brandLabel}
            </div>
          )}
          <h2
            id={`category-heading-${category.id}`}
            className="text-3xl font-semibold tracking-tight"
            style={{ fontFamily: 'var(--heading-font)' }}
          >
            {name}
          </h2>
          <div className="mx-auto mt-3 h-px w-16 bg-[color-mix(in_srgb,var(--menu-primary)_40%,transparent)]" />
          {description && (
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      ) : !category.iconUrl ? (
        // ── T24.5 — no image uploaded: no banner at all. A plain title + item
        // count reads better than a placeholder block with a giant initial.
        <>
          <div
            className={cn('mb-3 flex items-baseline justify-between gap-3', template === 'COMPACT' && 'mb-2')}
            data-testid="category-plain-header"
          >
            <div className="min-w-0">
              {category.brandLabel && (
                <div className="mb-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {category.brandLabel}
                </div>
              )}
              <h2
                id={`category-heading-${category.id}`}
                className={cn(
                  'truncate font-bold leading-tight tracking-tight',
                  template === 'COMPACT' ? 'text-base' : 'text-xl',
                )}
                style={{ fontFamily: 'var(--heading-font)' }}
              >
                {name}
              </h2>
            </div>
            <span
              className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground"
              aria-label={`${productCount} ${productCountLabel}`}
              data-testid="category-plain-header-count"
            >
              {productCount}
            </span>
          </div>
          {description && template !== 'COMPACT' && (
            <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </>
      ) : (
        // ── Classic / Compact: full-width banner header (T21.11) ──
        <>
          <CategoryBannerHeader
            iconUrl={category.iconUrl}
            name={name}
            brandLabel={category.brandLabel}
            template={template}
            headingId={`category-heading-${category.id}`}
            productCount={productCount}
            productCountLabel={productCountLabel}
          />
          {description && template !== 'COMPACT' && (
            <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </>
      )}

      <div className={listClass} role="list" aria-label={name}>
        {category.products.map((product, productIndex) => (
          <div
            key={product.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 100 + productIndex * 50}ms` }}
            role="listitem"
          >
            <ProductCardRenderer
              product={product}
              locale={locale}
              settings={settings}
              template={template}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
