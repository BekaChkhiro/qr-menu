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
  accentColor?: string | null;
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
  iconUrl?: string | null;
  name: string;
  brandLabel?: string | null;
  accentColor?: string | null;
  template: MenuTemplate;
  headingId: string;
  productCount: number;
  productCountLabel: string;
}

function CategoryBannerHeader({
  iconUrl,
  name,
  brandLabel,
  accentColor,
  template,
  headingId,
  productCount,
  productCountLabel,
}: BannerProps) {
  const isCompact = template === 'COMPACT';

  const fallbackStyle = accentColor
    ? {
        background: `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 20%, hsl(240 6% 15%)), color-mix(in srgb, ${accentColor} 55%, hsl(240 6% 8%)))`,
      }
    : undefined;

  return (
    <div
      className={cn(
        'relative mb-4 overflow-hidden rounded-xl',
        isCompact ? 'h-[120px] sm:h-[160px]' : 'h-[140px] sm:h-[180px] md:h-[240px]',
      )}
      data-testid="category-banner"
    >
      {iconUrl ? (
        <Image
          src={iconUrl}
          alt=""
          fill
          sizes="(max-width: 672px) 100vw, 672px"
          className="object-cover"
          aria-hidden
        />
      ) : (
        <div
          className={cn('absolute inset-0', !accentColor && 'bg-muted')}
          style={fallbackStyle}
          aria-hidden
        >
          <span
            className="absolute inset-0 flex items-center justify-center select-none font-bold leading-none text-white opacity-20"
            style={{ fontSize: 'clamp(3rem, 15vw, 8rem)' }}
            data-testid="category-banner-initial"
          >
            {[...name.trim()][0]?.toUpperCase() ?? '?'}
          </span>
        </div>
      )}

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
  accentColor,
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
      ) : (
        // ── Classic / Compact: full-width banner header (T21.11) ──
        <>
          <CategoryBannerHeader
            iconUrl={category.iconUrl}
            name={name}
            brandLabel={category.brandLabel}
            accentColor={accentColor}
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
