'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Eye,
  EyeOff,
  AlertTriangle,
  ChevronDown,
  Flame,
  Box,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';
import { PriceTag, OldPriceTag } from './price-tag';
import { DietaryBadge } from './dietary-badge';
import { ArViewerDialog } from './ar-viewer-dialog';
import { ProductAddButton } from './product-add-button';
import { useTableMode } from './table-mode-provider';
import {
  allergenLabels,
  allergenShort,
  arStrings,
  ribbonLabels,
  ribbonOverlayClass,
  ribbonPillClass,
  sortRibbons,
  toNumber,
  getProductName,
  getProductDescription,
  getVariationName,
} from './product-card-shared';

export interface PublicDisplaySettings {
  currencySymbol: string;
  allergenDisplay: 'TEXT' | 'ICON' | 'WARNING';
  caloriesDisplay: 'DIRECT' | 'FLIP_REVEAL' | 'HIDDEN';
  showNutrition: boolean;
  showDiscount: boolean;
  productCardStyle?: 'FLAT' | 'BORDERED' | 'ELEVATED' | 'MINIMAL';
  productTouchEffect?: 'NONE' | 'SCALE' | 'GLOW' | 'GRADIENT';
}

const cardStyleClasses: Record<
  NonNullable<PublicDisplaySettings['productCardStyle']>,
  string
> = {
  BORDERED: 'border border-border/70 rounded-2xl',
  ELEVATED: 'border border-border/40 rounded-2xl shadow-sm',
  FLAT: 'border-b border-border/60 rounded-none',
  MINIMAL: 'border-0 rounded-lg bg-transparent shadow-none',
};

const touchEffectClasses: Record<
  NonNullable<PublicDisplaySettings['productTouchEffect']>,
  string
> = {
  SCALE: 'transition-transform duration-200 active:scale-[0.99]',
  GLOW: 'transition-shadow duration-200 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_8px_24px_-8px_rgba(0,0,0,0.12)]',
  GRADIENT:
    'transition-colors duration-200 hover:bg-gradient-to-br hover:from-muted/30 hover:to-transparent',
  NONE: '',
};

export interface PublicProduct {
  id: string;
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
  descriptionKa: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  price: number | string;
  oldPrice?: number | string | null;
  currency: string;
  imageUrl: string | null;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  allergens: string[];
  ribbons?: string[];
  isVegan?: boolean;
  isVegetarian?: boolean;
  calories?: number | null;
  protein?: number | string | null;
  fats?: number | string | null;
  carbs?: number | string | null;
  fiber?: number | string | null;
  variations: Array<{
    id: string;
    nameKa: string;
    nameEn: string | null;
    nameRu: string | null;
    price: number | string;
  }>;
  arEnabled?: boolean;
  arModelUrl?: string | null;
  arModelUrlIos?: string | null;
  arPosterUrl?: string | null;
}

interface ProductCardProps {
  product: PublicProduct;
  locale: Locale;
  settings: PublicDisplaySettings;
}

function discountPercent(price: number, oldPrice: number): number {
  if (oldPrice <= 0) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export function ProductCard({ product, locale, settings }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [caloriesRevealed, setCaloriesRevealed] = useState(false);
  const [nutritionOpen, setNutritionOpen] = useState(false);
  const [arOpen, setArOpen] = useState(false);

  const tableMode = useTableMode();
  const arAvailable = !!product.arEnabled && !!product.arModelUrl;

  const name = getProductName(product, locale);
  const description = getProductDescription(product, locale);

  const hasVariations = product.variations.length > 0;
  const hasAllergens = product.allergens.length > 0;
  const ribbons = sortRibbons(product.ribbons || []);
  const topRibbon = ribbons[0];

  const priceNum = toNumber(product.price) ?? 0;
  const oldPriceNum = toNumber(product.oldPrice);
  const showDiscountRibbon =
    settings.showDiscount && oldPriceNum && oldPriceNum > priceNum;
  const discountPct = showDiscountRibbon
    ? discountPercent(priceNum, oldPriceNum!)
    : 0;

  const caloriesNum = product.calories ?? null;
  const hasNutrition =
    product.protein != null ||
    product.fats != null ||
    product.carbs != null ||
    product.fiber != null;

  const showsDietaryIcon = product.isVegan || product.isVegetarian;
  const showCalories = settings.caloriesDisplay !== 'HIDDEN' && caloriesNum !== null;
  const hasMetaRow = showCalories || hasAllergens;

  const variationsLabel =
    locale === 'ka' ? 'ვარიაციები' : locale === 'ru' ? 'Варианты' : 'Variations';
  const allergenLabel =
    locale === 'ka' ? 'ალერგენები' : locale === 'ru' ? 'Аллергены' : 'Allergens';

  const focalX = product.imageFocalX ?? 0.5;
  const focalY = product.imageFocalY ?? 0.5;

  const cardClass = cardStyleClasses[settings.productCardStyle || 'BORDERED'];
  const effectClass = touchEffectClasses[settings.productTouchEffect || 'SCALE'];

  return (
    <Card className={cn('overflow-hidden bg-card', cardClass, effectClass)}>
      <CardContent className="p-0">
        <article className="flex gap-4 p-4" aria-label={name}>
          {/* ── Image column ── */}
          {product.imageUrl && !imageError && (
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-black/5">
              {!imageLoaded && <Skeleton className="absolute inset-0" />}
              <Image
                src={product.imageUrl}
                alt={name}
                fill
                className={cn(
                  'object-cover transition-opacity duration-300',
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                )}
                style={{
                  objectPosition: `${focalX * 100}% ${focalY * 100}%`,
                }}
                sizes="96px"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />

              {/* Top-priority ribbon (overlay) */}
              {topRibbon && (
                <span
                  className={cn(
                    'absolute top-1.5 left-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide shadow-sm backdrop-blur-sm',
                    ribbonOverlayClass[topRibbon] || 'bg-black/80 text-white'
                  )}
                >
                  {ribbonLabels[topRibbon]?.[locale] || topRibbon}
                </span>
              )}

              {/* Discount */}
              {showDiscountRibbon && (
                <span className="absolute top-1.5 right-1.5 inline-flex items-center rounded-full bg-red-600/95 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  −{discountPct}%
                </span>
              )}

              {/* AR chip — only when product has a usable 3D model */}
              {arAvailable && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setArOpen(true);
                  }}
                  className={cn(
                    'absolute right-1.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-foreground shadow-sm ring-1 ring-black/10 backdrop-blur-sm transition-colors hover:bg-white',
                    showDiscountRibbon ? 'top-7' : 'top-1.5'
                  )}
                  data-testid="public-product-ar-chip"
                  aria-label={arStrings[locale].viewButton}
                >
                  <Box className="h-2.5 w-2.5" strokeWidth={2.25} />
                  AR
                </button>
              )}

              {/* Dietary — VG/V text chip (research: EU convention, accessibility) */}
              {showsDietaryIcon && (
                <div className="absolute bottom-1.5 right-1.5 flex flex-col gap-1">
                  {product.isVegan && (
                    <DietaryBadge kind="VEGAN" variant="overlay" locale={locale} />
                  )}
                  {!product.isVegan && product.isVegetarian && (
                    <DietaryBadge
                      kind="VEGETARIAN"
                      variant="overlay"
                      locale={locale}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Content column ── */}
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* Row 1 — title + price */}
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[15.5px] font-semibold leading-snug tracking-tight">
                {name}
              </h3>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                {showDiscountRibbon && !hasVariations && (
                  <OldPriceTag
                    value={oldPriceNum!}
                    symbol={settings.currencySymbol}
                  />
                )}
                {hasVariations ? (
                  <span
                    className="inline-flex items-baseline gap-1 whitespace-nowrap"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    <span className="text-[11px] text-muted-foreground">
                      {locale === 'ka'
                        ? 'დან'
                        : locale === 'ru'
                        ? 'от'
                        : 'from'}
                    </span>
                    <PriceTag
                      value={toNumber(product.variations[0].price) ?? 0}
                      symbol={settings.currencySymbol}
                    />
                  </span>
                ) : (
                  <PriceTag
                    value={priceNum}
                    symbol={settings.currencySymbol}
                  />
                )}
              </div>
            </div>

            {/* Row 2 — description */}
            {description && (
              <p className="line-clamp-2 text-[13px] leading-[1.55] text-muted-foreground">
                {description}
              </p>
            )}

            {/* Row 3 — secondary ribbons (when multiple) */}
            {(ribbons.length > 1 || !product.imageUrl) && ribbons.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {ribbons
                  .slice(product.imageUrl ? 1 : 0, 4)
                  .map((r) => (
                    <span
                      key={r}
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium',
                        ribbonPillClass[r] || 'bg-muted text-muted-foreground'
                      )}
                    >
                      {ribbonLabels[r]?.[locale] || r}
                    </span>
                  ))}
              </div>
            )}

            {/* Row 4 — variations */}
            {hasVariations && (
              <div
                className="flex flex-wrap gap-1 pt-0.5"
                role="list"
                aria-label={variationsLabel}
              >
                {product.variations.map((variation) => (
                  <span
                    key={variation.id}
                    className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-foreground/80"
                    role="listitem"
                  >
                    <span>{getVariationName(variation, locale)}</span>
                    <span className="text-muted-foreground/60">·</span>
                    <PriceTag
                      value={toNumber(variation.price) ?? 0}
                      symbol={settings.currencySymbol}
                      size="text-[11px]"
                      weight="font-semibold"
                      symbolSize="text-[9.5px]"
                    />
                  </span>
                ))}
              </div>
            )}

            {/* Row 5 — consolidated meta: calories + allergens + nutrition trigger */}
            {(hasMetaRow || (settings.showNutrition && hasNutrition)) && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1">
                {showCalories && (
                  settings.caloriesDisplay === 'FLIP_REVEAL' ? (
                    <button
                      type="button"
                      onClick={() => setCaloriesRevealed((v) => !v)}
                      className="inline-flex items-center gap-1 rounded-full px-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {caloriesRevealed ? (
                        <>
                          <Eye className="h-3 w-3" />
                          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {caloriesNum} kcal
                          </span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" />
                          <span>
                            {locale === 'ka'
                              ? 'კალორიები'
                              : locale === 'ru'
                              ? 'Калории'
                              : 'Calories'}
                          </span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      <Flame className="h-3 w-3 text-muted-foreground/70" />
                      {caloriesNum} kcal
                    </span>
                  )
                )}

                {hasAllergens && (
                  <div
                    className="flex flex-wrap items-center gap-1"
                    role="list"
                    aria-label={allergenLabel}
                  >
                    {product.allergens.map((allergen) => (
                      <AllergenBadge
                        key={allergen}
                        allergen={allergen}
                        mode={settings.allergenDisplay}
                        locale={locale}
                      />
                    ))}
                  </div>
                )}

                {settings.showNutrition && hasNutrition && (
                  <button
                    type="button"
                    onClick={() => setNutritionOpen((v) => !v)}
                    className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown
                      className={cn(
                        'h-3 w-3 transition-transform',
                        nutritionOpen && 'rotate-180'
                      )}
                    />
                    {locale === 'ka'
                      ? 'კვ. ღირებულება'
                      : locale === 'ru'
                      ? 'Пищ. ценность'
                      : 'Nutrition'}
                  </button>
                )}
              </div>
            )}

            {/* Add to table CTA — only present when this menu is rendered in table mode */}
            {tableMode && (
              <div className="pt-2">
                <ProductAddButton
                  product={product}
                  locale={locale}
                  currencySymbol={settings.currencySymbol}
                />
              </div>
            )}

            {/* Nutrition panel */}
            {settings.showNutrition && hasNutrition && nutritionOpen && (
              <div
                className="mt-1 grid grid-cols-4 gap-2 rounded-lg bg-muted/40 px-3 py-2 text-center text-[11px]"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {product.protein != null && (
                  <div>
                    <div className="font-semibold">
                      {Number(product.protein).toFixed(0)}g
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Protein
                    </div>
                  </div>
                )}
                {product.fats != null && (
                  <div>
                    <div className="font-semibold">
                      {Number(product.fats).toFixed(0)}g
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Fats
                    </div>
                  </div>
                )}
                {product.carbs != null && (
                  <div>
                    <div className="font-semibold">
                      {Number(product.carbs).toFixed(0)}g
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Carbs
                    </div>
                  </div>
                )}
                {product.fiber != null && (
                  <div>
                    <div className="font-semibold">
                      {Number(product.fiber).toFixed(0)}g
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Fiber
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </article>
      </CardContent>

      {arAvailable && (
        <ArViewerDialog
          open={arOpen}
          onOpenChange={setArOpen}
          glbUrl={product.arModelUrl as string}
          usdzUrl={product.arModelUrlIos}
          posterUrl={product.arPosterUrl ?? product.imageUrl}
          alt={name}
          locale={locale}
        />
      )}
    </Card>
  );
}

// ── Allergen badge ──────────────────────────────────
interface AllergenBadgeProps {
  allergen: string;
  mode: PublicDisplaySettings['allergenDisplay'];
  locale: Locale;
}

function AllergenBadge({ allergen, mode, locale }: AllergenBadgeProps) {
  const label = allergenLabels[allergen]?.[locale] || allergen;
  const short = allergenShort[allergen] || '?';

  if (mode === 'ICON') {
    return (
      <span
        className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-50 px-1 text-[9.5px] font-bold text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900"
        title={label}
        aria-label={label}
      >
        {short}
      </span>
    );
  }

  if (mode === 'WARNING') {
    return (
      <span
        className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900"
        title={label}
      >
        <AlertTriangle className="h-2.5 w-2.5" />
        {short}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900">
      {label}
    </span>
  );
}
