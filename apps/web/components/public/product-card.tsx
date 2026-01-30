'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

interface ProductVariation {
  id: string;
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
  price: number | string; // Can be string after JSON serialization of Decimal
}

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
  variations: ProductVariation[];
}

interface ProductCardProps {
  product: Product;
  locale: Locale;
}

const allergenLabels: Record<string, Record<Locale, string>> = {
  GLUTEN: { ka: 'გლუტენი', en: 'Gluten', ru: 'Глютен' },
  DAIRY: { ka: 'რძის პროდუქტები', en: 'Dairy', ru: 'Молочные' },
  EGGS: { ka: 'კვერცხი', en: 'Eggs', ru: 'Яйца' },
  NUTS: { ka: 'თხილეული', en: 'Nuts', ru: 'Орехи' },
  SEAFOOD: { ka: 'ზღვის პროდუქტები', en: 'Seafood', ru: 'Морепродукты' },
  SOY: { ka: 'სოია', en: 'Soy', ru: 'Соя' },
  PORK: { ka: 'ღორის ხორცი', en: 'Pork', ru: 'Свинина' },
};

function getProductName(product: Product, locale: Locale): string {
  switch (locale) {
    case 'en':
      return product.nameEn || product.nameKa;
    case 'ru':
      return product.nameRu || product.nameKa;
    default:
      return product.nameKa;
  }
}

function getProductDescription(product: Product, locale: Locale): string | null {
  switch (locale) {
    case 'en':
      return product.descriptionEn || product.descriptionKa;
    case 'ru':
      return product.descriptionRu || product.descriptionKa;
    default:
      return product.descriptionKa;
  }
}

function getVariationName(variation: ProductVariation, locale: Locale): string {
  switch (locale) {
    case 'en':
      return variation.nameEn || variation.nameKa;
    case 'ru':
      return variation.nameRu || variation.nameKa;
    default:
      return variation.nameKa;
  }
}

function formatPrice(price: number | string, currency: string): string {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `${numericPrice.toFixed(2)} ${currency}`;
}

function getAllergenLabel(allergen: string, locale: Locale): string {
  return allergenLabels[allergen]?.[locale] || allergen;
}

export function ProductCard({ product, locale }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const name = getProductName(product, locale);
  const description = getProductDescription(product, locale);
  const hasVariations = product.variations.length > 0;
  const hasAllergens = product.allergens.length > 0;

  // Determine price display
  const priceDisplay = hasVariations ? (
    <span className="text-sm text-muted-foreground whitespace-nowrap">
      {locale === 'ka' ? 'დან' : locale === 'ru' ? 'от' : 'from'}{' '}
      <span className="font-semibold text-primary">
        {formatPrice(product.variations[0].price, product.currency)}
      </span>
    </span>
  ) : (
    <span className="font-semibold text-primary whitespace-nowrap">
      {formatPrice(product.price, product.currency)}
    </span>
  );

  const allergenLabel = locale === 'ka' ? 'ალერგენები' : locale === 'ru' ? 'Аллергены' : 'Allergens';
  const variationsLabel = locale === 'ka' ? 'ვარიაციები' : locale === 'ru' ? 'Варианты' : 'Variations';

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/20 touch-feedback">
      <CardContent className="p-0">
        <article className="flex gap-4 p-4" aria-label={name}>
          {/* Product Image */}
          {product.imageUrl && !imageError && (
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
              {!imageLoaded && (
                <Skeleton className="absolute inset-0 rounded-lg" aria-hidden="true" />
              )}
              <Image
                src={product.imageUrl}
                alt={name}
                fill
                className={cn(
                  'object-cover transition-opacity duration-300',
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                )}
                sizes="(min-width: 640px) 96px, 80px"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </div>
          )}

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-3">
              <h3 className="font-semibold leading-tight text-base">{name}</h3>
              <div className="flex-shrink-0 text-right" aria-label={`Price: ${hasVariations ? formatPrice(product.variations[0].price, product.currency) : formatPrice(product.price, product.currency)}`}>
                {priceDisplay}
              </div>
            </div>

            {description && (
              <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                {description}
              </p>
            )}

            {/* Variations */}
            {hasVariations && (
              <div className="mt-2.5 flex flex-wrap gap-1.5" role="list" aria-label={variationsLabel}>
                {product.variations.map((variation) => (
                  <Badge
                    key={variation.id}
                    variant="secondary"
                    className="text-xs font-medium px-2 py-0.5"
                    role="listitem"
                  >
                    {getVariationName(variation, locale)} -{' '}
                    {formatPrice(variation.price, product.currency)}
                  </Badge>
                ))}
              </div>
            )}

            {/* Allergens */}
            {hasAllergens && (
              <div className="mt-2.5 flex flex-wrap gap-1.5" role="list" aria-label={allergenLabel}>
                {product.allergens.map((allergen) => (
                  <Badge
                    key={allergen}
                    variant="outline"
                    className="text-xs text-orange-600 border-orange-200 bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:bg-orange-950"
                    role="listitem"
                  >
                    {getAllergenLabel(allergen, locale)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </article>
      </CardContent>
    </Card>
  );
}
