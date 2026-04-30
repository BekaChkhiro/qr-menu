'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, AlertTriangle, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';
import type { PublicDisplaySettings, PublicProduct } from './product-card';
import { PriceTag, OldPriceTag } from './price-tag';
import { DietaryBadge } from './dietary-badge';
import { ArViewerDialog } from './ar-viewer-dialog';
import {
  allergenLabels,
  allergenShort,
  arStrings,
  ribbonLabels,
  ribbonPillClass,
  sortRibbons,
  toNumber,
  getProductName,
  getProductDescription,
  getVariationName,
} from './product-card-shared';

interface Props {
  product: PublicProduct;
  locale: Locale;
  settings: PublicDisplaySettings;
}

// Left-edge stripe color for top-priority ribbon (subtle but noticeable)
const ribbonStripeColor: Record<string, string> = {
  POPULAR: 'bg-red-500',
  CHEF_CHOICE: 'bg-amber-500',
  DAILY_DISH: 'bg-emerald-600',
  NEW: 'bg-sky-500',
  SPICY: 'bg-orange-500',
};

/**
 * Compact template — list-style restaurant menu. Comfortable touch
 * targets (min 52px tall), left-edge ribbon stripe, expandable detail.
 */

export function ProductCardCompact({ product, locale, settings }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [arOpen, setArOpen] = useState(false);

  const arAvailable = !!product.arEnabled && !!product.arModelUrl;

  const name = getProductName(product, locale);
  const description = getProductDescription(product, locale);
  const hasVariations = product.variations.length > 0;
  const ribbons = sortRibbons(product.ribbons || []);
  const topRibbon = ribbons[0];

  const priceNum = toNumber(product.price) ?? 0;
  const oldPriceNum = toNumber(product.oldPrice);
  const showDiscount = settings.showDiscount && oldPriceNum && oldPriceNum > priceNum;

  const caloriesNum = product.calories ?? null;
  const focalX = product.imageFocalX ?? 0.5;
  const focalY = product.imageFocalY ?? 0.5;

  const hasMore =
    description ||
    hasVariations ||
    caloriesNum !== null ||
    ribbons.length > 1 ||
    (product.allergens && product.allergens.length > 0) ||
    (settings.showNutrition &&
      (product.protein != null || product.fats != null || product.carbs != null));

  return (
    <article
      id={`product-${product.id}`}
      className="relative border-b border-border/40 last:border-b-0"
      aria-label={name}
    >
      {/* Left-edge color stripe for top ribbon (absolute, subtle) */}
      {topRibbon && (
        <span
          aria-hidden
          className={cn(
            'absolute left-0 top-2 bottom-2 w-[3px] rounded-full',
            ribbonStripeColor[topRibbon] || 'bg-muted-foreground/40'
          )}
          title={ribbonLabels[topRibbon]?.[locale] || topRibbon}
        />
      )}

      {/* AR chip — absolutely positioned to live outside the row toggle button */}
      {arAvailable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setArOpen(true);
          }}
          className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 px-1.5 py-0.5 text-[9.5px] font-bold text-foreground shadow-sm ring-1 ring-black/10 backdrop-blur-sm transition-colors hover:bg-white"
          data-testid="public-product-ar-chip"
          aria-label={arStrings[locale].viewButton}
        >
          <Box className="h-2.5 w-2.5" strokeWidth={2.25} />
          AR
        </button>
      )}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        disabled={!hasMore}
        className={cn(
          'flex min-h-[60px] w-full items-center gap-3 py-3 pl-3 pr-2 text-left transition-colors',
          hasMore && 'hover:bg-muted/30 cursor-pointer',
          !hasMore && 'cursor-default'
        )}
      >
        {/* Main column */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {/* Dietary inline (text-based) */}
            {product.isVegan && (
              <DietaryBadge kind="VEGAN" variant="minimal" locale={locale} />
            )}
            {!product.isVegan && product.isVegetarian && (
              <DietaryBadge kind="VEGETARIAN" variant="minimal" locale={locale} />
            )}

            <h3 className="truncate text-[14.5px] font-medium leading-tight tracking-tight">
              {name}
            </h3>

            {/* Top ribbon as inline tiny label (one only) */}
            {topRibbon && (
              <span
                className={cn(
                  'shrink-0 rounded-sm px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider',
                  ribbonPillClass[topRibbon] || 'bg-muted text-muted-foreground'
                )}
              >
                {ribbonLabels[topRibbon]?.[locale] || topRibbon}
              </span>
            )}
          </div>

          {description && (
            <p className="mt-1 truncate text-[12px] leading-tight text-muted-foreground">
              {description}
            </p>
          )}

          <div className="mt-1 flex items-center gap-2">
            {showDiscount && (
              <OldPriceTag
                value={oldPriceNum!}
                symbol={settings.currencySymbol}
              />
            )}
            {hasVariations ? (
              <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
                <span className="text-[10.5px] text-muted-foreground">
                  {locale === 'ka' ? 'დან' : 'from'}
                </span>
                <PriceTag
                  value={toNumber(product.variations[0].price) ?? 0}
                  symbol={settings.currencySymbol}
                  size="text-[12.5px]"
                  symbolSize="text-[10px]"
                />
              </span>
            ) : (
              <PriceTag
                value={priceNum}
                symbol={settings.currencySymbol}
                size="text-[12.5px]"
                symbolSize="text-[10px]"
              />
            )}
            {caloriesNum !== null && settings.caloriesDisplay !== 'HIDDEN' && (
              <span
                className="text-[11px] text-muted-foreground"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                · {caloriesNum} kcal
              </span>
            )}
          </div>
        </div>

        {/* Thumbnail */}
        {product.imageUrl && (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-black/5">
            <Image
              src={product.imageUrl}
              alt=""
              fill
              className="object-cover"
              style={{ objectPosition: `${focalX * 100}% ${focalY * 100}%` }}
              sizes="56px"
            />
            {showDiscount && (
              <div
                className="absolute inset-x-0 bottom-0 bg-red-600/95 py-0.5 text-center text-[9px] font-bold text-white"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                −{Math.round(((oldPriceNum! - priceNum) / oldPriceNum!) * 100)}%
              </div>
            )}
          </div>
        )}

        {hasMore && (
          <ChevronDown
            className={cn(
              'h-5 w-5 shrink-0 text-muted-foreground/60 transition-transform',
              expanded && 'rotate-180 text-muted-foreground'
            )}
          />
        )}
      </button>

      {/* Expand panel */}
      {expanded && hasMore && (
        <div className="space-y-2.5 border-t border-border/40 bg-muted/20 px-3 pb-3 pt-3">
          {description && description.length > 60 && (
            <p className="text-[13px] leading-[1.55] text-foreground/80">
              {description}
            </p>
          )}

          {ribbons.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {ribbons.slice(1).map((r) => (
                <span
                  key={r}
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                    ribbonPillClass[r] || 'bg-muted text-muted-foreground'
                  )}
                >
                  {ribbonLabels[r]?.[locale] || r}
                </span>
              ))}
            </div>
          )}

          {hasVariations && (
            <div className="flex flex-wrap gap-1">
              {product.variations.map((v) => (
                <span
                  key={v.id}
                  className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-border/60"
                >
                  <span>{getVariationName(v, locale)}</span>
                  <span className="text-muted-foreground/60">·</span>
                  <PriceTag
                    value={toNumber(v.price) ?? 0}
                    symbol={settings.currencySymbol}
                    size="text-[11px]"
                    symbolSize="text-[9.5px]"
                  />
                </span>
              ))}
            </div>
          )}

          {product.allergens.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.allergens.map((a) => (
                <AllergenChip
                  key={a}
                  allergen={a}
                  mode={settings.allergenDisplay}
                  locale={locale}
                />
              ))}
            </div>
          )}

          {settings.showNutrition &&
            (product.protein != null ||
              product.fats != null ||
              product.carbs != null ||
              product.fiber != null) && (
              <div
                className="grid grid-cols-4 divide-x divide-border/40 rounded-lg bg-background/80 ring-1 ring-border/40 text-center text-[10.5px]"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {product.protein != null && (
                  <div className="py-1.5">
                    <div className="font-semibold">
                      {Number(product.protein).toFixed(0)}g
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      P
                    </div>
                  </div>
                )}
                {product.fats != null && (
                  <div className="py-1.5">
                    <div className="font-semibold">
                      {Number(product.fats).toFixed(0)}g
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      F
                    </div>
                  </div>
                )}
                {product.carbs != null && (
                  <div className="py-1.5">
                    <div className="font-semibold">
                      {Number(product.carbs).toFixed(0)}g
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      C
                    </div>
                  </div>
                )}
                {product.fiber != null && (
                  <div className="py-1.5">
                    <div className="font-semibold">
                      {Number(product.fiber).toFixed(0)}g
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Fi
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      )}

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

function AllergenChip({
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
        className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-50 px-1 text-[9.5px] font-bold text-amber-800 ring-1 ring-amber-200"
      >
        {short}
      </span>
    );
  }
  if (mode === 'WARNING') {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[9.5px] font-bold text-red-700 ring-1 ring-red-200">
        <AlertTriangle className="h-2.5 w-2.5" />
        {short}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-amber-200">
      {label}
    </span>
  );
}
