'use client';

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

  // Per-template header styling
  const headerClass =
    template === 'MAGAZINE'
      ? 'mb-6 text-center'
      : template === 'COMPACT'
      ? 'mb-2 pb-2 border-b border-border/40'
      : 'mb-4 pb-3 border-b border-border/50';

  const headingClass =
    template === 'MAGAZINE'
      ? 'text-3xl font-semibold tracking-tight'
      : template === 'COMPACT'
      ? 'text-base font-semibold tracking-tight'
      : 'text-xl font-bold tracking-tight';

  // Per-template product list container
  const listClass =
    template === 'MAGAZINE'
      ? 'space-y-6'
      : template === 'COMPACT'
      ? 'rounded-xl bg-card ring-1 ring-border/60 overflow-hidden px-3'
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
        <div className={headerClass}>
          {category.brandLabel && (
            <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
              {category.brandLabel}
            </div>
          )}
          <h2
            id={`category-heading-${category.id}`}
            className={headingClass}
            style={{ fontFamily: 'var(--heading-font)' }}
          >
            {name}
          </h2>
          <div className="mx-auto mt-3 h-px w-16 bg-primary/40" />
          {description && (
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      ) : (
        // ── Classic / Compact: default header with count badge ──
        <div className={headerClass}>
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-2 min-w-0">
              {category.brandLabel && (
                <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                  {category.brandLabel}
                </span>
              )}
              <h2
                id={`category-heading-${category.id}`}
                className={cn(headingClass, 'truncate')}
              >
                {name}
              </h2>
            </div>
            <span
              className="text-xs text-muted-foreground font-medium px-2 py-0.5 bg-muted rounded-full shrink-0"
              aria-label={`${productCount} ${productCountLabel}`}
            >
              {productCount}
            </span>
          </div>
          {description && template !== 'COMPACT' && (
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
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
