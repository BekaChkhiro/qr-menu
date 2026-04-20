'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Utensils, CupSoda, LayoutGrid } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CategoryNav } from './category-nav';
import { CategorySection } from './category-section';
import type { Locale } from '@/i18n/config';
import type { PublicDisplaySettings, PublicProduct } from './product-card';
import type { MenuTemplate } from '@/types/menu';

type CategoryType = 'FOOD' | 'DRINK' | 'OTHER';
type MenuLayout = 'LINEAR' | 'CATEGORIES_FIRST';

interface PublicCategory {
  id: string;
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
  descriptionKa: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  iconUrl: string | null;
  brandLabel: string | null;
  type: CategoryType;
  products: PublicProduct[];
}

interface MenuBodyProps {
  categories: PublicCategory[];
  locale: Locale;
  settings: PublicDisplaySettings;
  layout: MenuLayout;
  splitByType: boolean;
  template?: MenuTemplate;
}

function getName(cat: PublicCategory, locale: Locale): string {
  switch (locale) {
    case 'en':
      return cat.nameEn || cat.nameKa;
    case 'ru':
      return cat.nameRu || cat.nameKa;
    default:
      return cat.nameKa;
  }
}

export function MenuBody({
  categories,
  locale,
  settings,
  layout,
  splitByType,
  template = 'CLASSIC',
}: MenuBodyProps) {
  const [showGrid, setShowGrid] = useState(layout === 'CATEGORIES_FIRST');
  const [activeType, setActiveType] = useState<CategoryType | 'ALL'>('ALL');

  // Filter by Foods/Drinks tab when split is on
  const filteredCategories = useMemo(() => {
    if (!splitByType || activeType === 'ALL') return categories;
    return categories.filter((c) => c.type === activeType);
  }, [categories, splitByType, activeType]);

  const hasFood = categories.some((c) => c.type === 'FOOD');
  const hasDrink = categories.some((c) => c.type === 'DRINK');

  const tabLabels: Record<'ALL' | 'FOOD' | 'DRINK', Record<Locale, string>> = {
    ALL: { ka: 'ყველა', en: 'All', ru: 'Все' },
    FOOD: { ka: 'საჭმელი', en: 'Foods', ru: 'Еда' },
    DRINK: { ka: 'სასმელი', en: 'Drinks', ru: 'Напитки' },
  };

  const jumpToCategory = (categoryId: string) => {
    setShowGrid(false);
    // Wait for section to render then scroll
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(`category-${categoryId}`);
        if (el) {
          const offset = 140;
          const pos = el.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top: pos, behavior: 'smooth' });
        }
      });
    });
  };

  // ── Category grid entry (CATEGORIES_FIRST mode) ──
  if (showGrid) {
    return (
      <div className="px-4 py-4">
        <div className="mx-auto max-w-2xl">
          {splitByType && (hasFood || hasDrink) && (
            <FoodsDrinksTabs
              activeType={activeType}
              onChange={setActiveType}
              hasFood={hasFood}
              hasDrink={hasDrink}
              labels={tabLabels}
              locale={locale}
            />
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => jumpToCategory(cat.id)}
                className="group flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-4 text-center transition-all hover:border-primary hover:shadow-lg active:scale-95"
              >
                {cat.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cat.iconUrl}
                    alt=""
                    className="h-16 w-16 object-contain"
                    aria-hidden
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-3xl">
                    {cat.type === 'FOOD' ? '🍽️' : cat.type === 'DRINK' ? '🥤' : '📋'}
                  </div>
                )}
                <div className="min-w-0 w-full">
                  {cat.brandLabel && (
                    <div className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                      {cat.brandLabel}
                    </div>
                  )}
                  <div className="line-clamp-2 text-sm font-medium">
                    {getName(cat, locale)}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {cat.products.length}{' '}
                    {locale === 'ka' ? 'პროდუქტი' : locale === 'ru' ? 'продукт' : 'items'}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowGrid(false)}
              className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              {locale === 'ka'
                ? 'სრული მენიუს ნახვა →'
                : locale === 'ru'
                ? 'Смотреть полное меню →'
                : 'View full menu →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Linear layout ──
  return (
    <>
      {splitByType && (hasFood || hasDrink) && (
        <div className="sticky top-[73px] z-[5] border-b bg-background/95 px-4 py-2 backdrop-blur">
          <div className="mx-auto max-w-2xl">
            <FoodsDrinksTabs
              activeType={activeType}
              onChange={setActiveType}
              hasFood={hasFood}
              hasDrink={hasDrink}
              labels={tabLabels}
              locale={locale}
            />
          </div>
        </div>
      )}

      {filteredCategories.length > 0 && (
        <CategoryNav categories={filteredCategories} locale={locale} />
      )}

      {layout === 'CATEGORIES_FIRST' && (
        <div className="mx-auto max-w-2xl px-4 pt-3">
          <button
            type="button"
            onClick={() => setShowGrid(true)}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            ← {locale === 'ka' ? 'კატეგორიების ხატულებზე დაბრუნება' : 'Back to category grid'}
          </button>
        </div>
      )}

      <main id="main-content" className="px-4 pb-8" tabIndex={-1}>
        <div className="mx-auto max-w-2xl">
          {filteredCategories.length > 0 ? (
            <div className="space-y-8">
              {filteredCategories.map((category, index) => (
                <CategorySection
                  key={category.id}
                  category={category}
                  locale={locale}
                  index={index}
                  settings={settings}
                  template={template}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground" role="status">
              {locale === 'ka'
                ? 'ამ კატეგორიაში პროდუქტები არ არის'
                : locale === 'ru'
                ? 'В этой категории нет продуктов'
                : 'No products in this category'}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

interface FoodsDrinksTabsProps {
  activeType: CategoryType | 'ALL';
  onChange: (type: CategoryType | 'ALL') => void;
  hasFood: boolean;
  hasDrink: boolean;
  labels: Record<'ALL' | 'FOOD' | 'DRINK', Record<Locale, string>>;
  locale: Locale;
}

function FoodsDrinksTabs({
  activeType,
  onChange,
  hasFood,
  hasDrink,
  labels,
  locale,
}: FoodsDrinksTabsProps) {
  const tabs: Array<{ id: 'ALL' | 'FOOD' | 'DRINK'; visible: boolean; icon: LucideIcon }> = [
    { id: 'ALL', visible: true, icon: LayoutGrid },
    { id: 'FOOD', visible: hasFood, icon: Utensils },
    { id: 'DRINK', visible: hasDrink, icon: CupSoda },
  ];

  return (
    <div className="inline-flex w-full items-center gap-1 rounded-full border bg-muted/50 p-1">
      {tabs
        .filter((t) => t.visible)
        .map((tab) => {
          const active = activeType === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all',
                active
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {labels[tab.id][locale]}
            </button>
          );
        })}
    </div>
  );
}
