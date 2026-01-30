'use client';

import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';
import { ProductCard } from './product-card';

interface Product {
  id: string;
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
  descriptionKa: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  price: number | string; // Can be string after JSON serialization of Decimal
  currency: string;
  imageUrl: string | null;
  allergens: string[];
  variations: Array<{
    id: string;
    nameKa: string;
    nameEn: string | null;
    nameRu: string | null;
    price: number | string; // Can be string after JSON serialization of Decimal
  }>;
}

interface Category {
  id: string;
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
  descriptionKa: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  products: Product[];
}

interface CategorySectionProps {
  category: Category;
  locale: Locale;
  index?: number;
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

export function CategorySection({ category, locale, index = 0 }: CategorySectionProps) {
  const name = getCategoryName(category, locale);
  const description = getCategoryDescription(category, locale);
  const productCount = category.products.length;

  const productCountLabel = locale === 'ka' ? 'პროდუქტი' : locale === 'ru' ? 'продукт' : 'products';

  return (
    <section
      id={`category-${category.id}`}
      className={cn(
        'scroll-mt-36 animate-fade-in',
        index === 0 && 'pt-6',
        index > 0 && 'pt-2'
      )}
      style={{ animationDelay: `${index * 100}ms` }}
      aria-labelledby={`category-heading-${category.id}`}
      role="tabpanel"
    >
      {/* Category Header */}
      <div className="mb-4 pb-3 border-b border-border/50">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id={`category-heading-${category.id}`} className="text-xl font-bold tracking-tight">{name}</h2>
          <span className="text-xs text-muted-foreground font-medium px-2 py-0.5 bg-muted rounded-full" aria-label={`${productCount} ${productCountLabel}`}>
            {productCount}
          </span>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Products */}
      <div className="space-y-3" role="list" aria-label={name}>
        {category.products.map((product, productIndex) => (
          <div
            key={product.id}
            className="animate-fade-in"
            style={{ animationDelay: `${(index * 100) + (productIndex * 50)}ms` }}
            role="listitem"
          >
            <ProductCard product={product} locale={locale} />
          </div>
        ))}
      </div>
    </section>
  );
}
