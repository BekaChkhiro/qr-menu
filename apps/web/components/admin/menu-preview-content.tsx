'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { CategorySection } from '@/components/public/category-section';
import { PromotionBanner } from '@/components/public/promotion-banner';
import type { MenuWithDetails, Category, Product, Promotion } from '@/types/menu';
import type { Locale } from '@/i18n/config';

// --- Types ---

interface MenuPreviewContentProps {
  menu: MenuWithDetails;
  locale: Locale;
}

/** Category with products guaranteed to be defined (post-filter). */
type CategoryWithProducts = Omit<Category, 'products'> & { products: Product[] };

// --- Data transformation ---

function filterActivePromotions(promotions: Promotion[]): Promotion[] {
  const now = new Date();
  return promotions.filter((p) => {
    if (!p.isActive) return false;
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return now >= start && now <= end;
  });
}

function filterCategories(categories: Category[]): CategoryWithProducts[] {
  return categories
    .map((cat) => ({
      ...cat,
      products: (cat.products ?? []).filter((p) => p.isAvailable),
    }))
    .filter((cat) => cat.products.length > 0);
}

// --- Locale helpers ---

function getMenuName(menu: MenuWithDetails): string {
  return menu.name;
}

function getMenuDescription(menu: MenuWithDetails): string | null {
  return menu.description;
}

const footerTranslations: Record<Locale, { createdWith: string; digitalMenu: string }> = {
  ka: { createdWith: 'შექმნილია', digitalMenu: 'Digital Menu' },
  en: { createdWith: 'Created with', digitalMenu: 'Digital Menu' },
  ru: { createdWith: 'Создано с помощью', digitalMenu: 'Digital Menu' },
};

function getCategoryName(
  cat: { nameKa: string; nameEn: string | null; nameRu: string | null },
  locale: Locale,
): string {
  switch (locale) {
    case 'en':
      return cat.nameEn || cat.nameKa;
    case 'ru':
      return cat.nameRu || cat.nameKa;
    default:
      return cat.nameKa;
  }
}

// --- Private sub-components ---

function PreviewHeader({
  name,
  description,
  logoUrl,
}: {
  name: string;
  description: string | null;
  logoUrl: string | null;
}) {
  return (
    <div className="border-b px-4 py-3">
      <div className="flex items-center gap-3">
        {logoUrl && (
          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-border/50 bg-muted">
            <Image
              src={logoUrl}
              alt={`${name} logo`}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold leading-tight">{name}</h2>
          {description && (
            <p className="truncate text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewCategoryNav({
  categories,
  locale,
}: {
  categories: CategoryWithProducts[];
  locale: Locale;
}) {
  if (categories.length === 0) return null;

  return (
    <div className="border-b px-4 py-2">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {categories.map((cat, i) => (
          <span
            key={cat.id}
            className={cn(
              'flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium',
              i === 0
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {getCategoryName(cat, locale)}
          </span>
        ))}
      </div>
    </div>
  );
}

function PreviewFooter({ locale }: { locale: Locale }) {
  const t = footerTranslations[locale];
  return (
    <div className="border-t px-4 py-4 text-center">
      <p className="text-xs text-muted-foreground">
        {t.createdWith}{' '}
        <span className="font-medium text-primary">{t.digitalMenu}</span>
      </p>
    </div>
  );
}

// --- Exported components ---

export function MenuPreviewContent({ menu, locale }: MenuPreviewContentProps) {
  const activePromotions = useMemo(
    () => filterActivePromotions(menu.promotions ?? []),
    [menu.promotions],
  );

  const visibleCategories = useMemo(
    () => filterCategories(menu.categories ?? []),
    [menu.categories],
  );

  const name = getMenuName(menu);
  const description = getMenuDescription(menu);
  const hasContent = visibleCategories.length > 0 || activePromotions.length > 0;

  if (!hasContent) {
    return <EmptyMenuPreview locale={locale} />;
  }

  return (
    <div
      className="min-h-full bg-background text-foreground"
      style={
        {
          '--primary': menu.primaryColor ?? undefined,
          '--accent': menu.accentColor ?? undefined,
        } as React.CSSProperties
      }
    >
      <PreviewHeader name={name} description={description} logoUrl={menu.logoUrl} />
      <PreviewCategoryNav categories={visibleCategories} locale={locale} />

      {/* Promotions */}
      {activePromotions.length > 0 && (
        <div className="space-y-3 px-4 pt-4">
          {activePromotions.map((promo) => (
            <PromotionBanner key={promo.id} promotion={promo} locale={locale} />
          ))}
        </div>
      )}

      {/* Categories & Products */}
      <div className="px-4 pb-4">
        {visibleCategories.map((cat, index) => (
          <CategorySection key={cat.id} category={cat} locale={locale} index={index} />
        ))}
      </div>

      <PreviewFooter locale={locale} />
    </div>
  );
}

export function MenuPreviewContentSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      {/* Category nav skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>

      {/* Product cards skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function EmptyMenuPreview({ locale }: { locale: Locale }) {
  const message =
    locale === 'ka'
      ? 'მენიუ ცარიელია. დაამატეთ კატეგორიები და პროდუქტები.'
      : locale === 'ru'
        ? 'Меню пустое. Добавьте категории и продукты.'
        : 'Menu is empty. Add categories and products.';

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <p className="text-center text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
