'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Eye, EyeOff, AlertTriangle, Flame, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';
import type { PublicDisplaySettings, PublicProduct } from './product-card';
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
  touchEffectClasses,
} from './product-card-shared';

interface Props {
  product: PublicProduct;
  locale: Locale;
  settings: PublicDisplaySettings;
}

/**
 * Magazine template — editorial hero with refined typography.
 * Spacing rhythm: 8/12/16/20/24px grid.
 */

export function ProductCardMagazine({ product, locale, settings }: Props) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [caloriesRevealed, setCaloriesRevealed] = useState(false);
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
  const showDiscount = settings.showDiscount && oldPriceNum && oldPriceNum > priceNum;
  const discountPct = showDiscount
    ? Math.round(((oldPriceNum! - priceNum) / oldPriceNum!) * 100)
    : 0;

  const caloriesNum = product.calories ?? null;
  const focalX = product.imageFocalX ?? 0.5;
  const focalY = product.imageFocalY ?? 0.5;

  const effectClass = touchEffectClasses[settings.productTouchEffect || 'SCALE'];

  return (
    <article
      id={`product-${product.id}`}
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-card ring-1 ring-border/60',
        effectClass
      )}
      aria-label={name}
    >
      {/* ── Hero image — 3:2 for editorial feel ── */}
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={name}
            fill
            className={cn(
              'object-cover transition-all duration-700',
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            )}
            style={{ objectPosition: `${focalX * 100}% ${focalY * 100}%` }}
            sizes="(min-width: 768px) 448px, 100vw"
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-muted-foreground/10" />
          </div>
        )}

        {/* Subtle top-to-transparent gradient for legibility */}
        {topRibbon && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/20 to-transparent" />
        )}

        {/* Top-priority ribbon — editorial tag */}
        {topRibbon && (
          <span
            className={cn(
              'absolute top-4 left-4 inline-flex items-center rounded-sm px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] shadow-sm',
              ribbonOverlayClass[topRibbon] || 'bg-black/80 text-white'
            )}
          >
            {ribbonLabels[topRibbon]?.[locale] || topRibbon}
          </span>
        )}

        {/* Discount badge */}
        {showDiscount && (
          <span
            className="absolute top-4 right-4 inline-flex items-center rounded-sm bg-red-600/95 px-2 py-1 text-[11px] font-bold text-white shadow-sm"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            −{discountPct}%
          </span>
        )}

        {/* AR chip */}
        {arAvailable && (
          <button
            type="button"
            onClick={() => setArOpen(true)}
            className={cn(
              'absolute right-4 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-foreground shadow-sm ring-1 ring-black/10 backdrop-blur-sm transition-colors hover:bg-white',
              showDiscount ? 'top-12' : 'top-4'
            )}
            data-testid="public-product-ar-chip"
            aria-label={arStrings[locale].viewButton}
          >
            <Box className="h-3 w-3" strokeWidth={2.25} />
            AR
          </button>
        )}

        {/* Dietary badges — research-based "VG" / "V" text chips */}
        {(product.isVegan || product.isVegetarian) && (
          <div className="absolute bottom-4 right-4 flex gap-1.5">
            {product.isVegan && (
              <DietaryBadge kind="VEGAN" variant="overlay" locale={locale} />
            )}
            {!product.isVegan && product.isVegetarian && (
              <DietaryBadge kind="VEGETARIAN" variant="overlay" locale={locale} />
            )}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="space-y-3 px-5 pb-5 pt-4">
        {/* Title row + price */}
        <div className="flex items-start justify-between gap-4">
          <h3
            className="text-[20px] font-semibold leading-tight tracking-tight"
            style={{ fontFamily: 'var(--heading-font)' }}
          >
            {name}
          </h3>
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            {showDiscount && (
              <OldPriceTag
                value={oldPriceNum!}
                symbol={settings.currencySymbol}
              />
            )}
            {hasVariations ? (
              <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
                <span className="text-[11px] text-muted-foreground">
                  {locale === 'ka' ? 'დან' : locale === 'ru' ? 'от' : 'from'}
                </span>
                <PriceTag
                  value={toNumber(product.variations[0].price) ?? 0}
                  symbol={settings.currencySymbol}
                  size="text-[18px]"
                  symbolSize="text-[12px]"
                />
              </span>
            ) : (
              <PriceTag
                value={priceNum}
                symbol={settings.currencySymbol}
                size="text-[18px]"
                symbolSize="text-[12px]"
              />
            )}
          </div>
        </div>

        {description && (
          <p className="text-[14px] leading-[1.6] text-muted-foreground">
            {description}
          </p>
        )}

        {/* Secondary ribbons — refined text pills */}
        {ribbons.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {ribbons.slice(1, 4).map((r) => (
              <span
                key={r}
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                  ribbonPillClass[r] || 'bg-muted text-muted-foreground'
                )}
              >
                {ribbonLabels[r]?.[locale] || r}
              </span>
            ))}
          </div>
        )}

        {/* Variations — menu-like options list */}
        {hasVariations && (
          <div className="flex flex-wrap gap-1.5">
            {product.variations.map((v) => (
              <span
                key={v.id}
                className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2.5 py-1 text-[11.5px] font-medium"
              >
                <span>{getVariationName(v, locale)}</span>
                <span className="text-muted-foreground/60">·</span>
                <PriceTag
                  value={toNumber(v.price) ?? 0}
                  symbol={settings.currencySymbol}
                  size="text-[11.5px]"
                  symbolSize="text-[10px]"
                />
              </span>
            ))}
          </div>
        )}

        {/* Meta row — calories + allergens */}
        {(caloriesNum !== null || hasAllergens) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border/50 pt-3">
            {settings.caloriesDisplay !== 'HIDDEN' && caloriesNum !== null && (
              settings.caloriesDisplay === 'FLIP_REVEAL' ? (
                <button
                  type="button"
                  onClick={() => setCaloriesRevealed((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {caloriesRevealed ? (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      <span
                        className="font-medium"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {caloriesNum} kcal
                      </span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
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
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  <Flame className="h-3.5 w-3.5 text-muted-foreground/70" />
                  {caloriesNum} kcal
                </span>
              )
            )}

            {hasAllergens && (
              <div className="flex flex-wrap gap-1">
                {product.allergens.slice(0, 6).map((a) => (
                  <AllergenInline
                    key={a}
                    allergen={a}
                    mode={settings.allergenDisplay}
                    locale={locale}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add to table CTA — only present when this menu is rendered in table mode */}
        {tableMode && (
          <div className="pt-1">
            <ProductAddButton
              product={product}
              locale={locale}
              currencySymbol={settings.currencySymbol}
            />
          </div>
        )}

        {/* Nutrition — editorial stats grid */}
        {settings.showNutrition &&
          (product.protein != null ||
            product.fats != null ||
            product.carbs != null ||
            product.fiber != null) && (
            <div
              className="grid grid-cols-4 divide-x divide-border/50 rounded-lg border border-border/50 text-center text-[12px]"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {product.protein != null && (
                <div className="py-2.5">
                  <div className="text-[14px] font-semibold">
                    {Number(product.protein).toFixed(0)}g
                  </div>
                  <div className="mt-0.5 text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                    Protein
                  </div>
                </div>
              )}
              {product.fats != null && (
                <div className="py-2.5">
                  <div className="text-[14px] font-semibold">
                    {Number(product.fats).toFixed(0)}g
                  </div>
                  <div className="mt-0.5 text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                    Fats
                  </div>
                </div>
              )}
              {product.carbs != null && (
                <div className="py-2.5">
                  <div className="text-[14px] font-semibold">
                    {Number(product.carbs).toFixed(0)}g
                  </div>
                  <div className="mt-0.5 text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                    Carbs
                  </div>
                </div>
              )}
              {product.fiber != null && (
                <div className="py-2.5">
                  <div className="text-[14px] font-semibold">
                    {Number(product.fiber).toFixed(0)}g
                  </div>
                  <div className="mt-0.5 text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                    Fiber
                  </div>
                </div>
              )}
            </div>
          )}
      </div>

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
    </article>
  );
}

function AllergenInline({
  allergen,
  mode,
  locale,
}: {
  allergen: string;
  mode: PublicDisplaySettings['allergenDisplay'];
  locale: Locale;
}) {
  const label = allergenLabels[allergen]?.[locale] || allergen;
  const short = allergenShort[allergen] || '?';

  if (mode === 'ICON') {
    return (
      <span
        title={label}
        className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-50 px-1 text-[10px] font-bold text-amber-800 ring-1 ring-amber-200"
      >
        {short}
      </span>
    );
  }
  if (mode === 'WARNING') {
    return (
      <span
        title={label}
        className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-red-200"
      >
        <AlertTriangle className="h-3 w-3" />
        {short}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200">
      {label}
    </span>
  );
}
