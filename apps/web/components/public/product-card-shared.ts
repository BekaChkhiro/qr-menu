import type { Locale } from '@/i18n/config';
import type { PublicProduct, PublicDisplaySettings } from './product-card';
import kaMenu from '@/messages/ka/menu.json';
import enMenu from '@/messages/en/menu.json';
import ruMenu from '@/messages/ru/menu.json';

// ── AR strings (sourced from messages/{locale}/menu.json `ar` block) ─────
export const arStrings: Record<Locale, typeof kaMenu.ar> = {
  ka: kaMenu.ar,
  en: enMenu.ar,
  ru: ruMenu.ar,
};

// ── Allergens ────────────────────────────────────────────────────
export const allergenLabels: Record<string, Record<Locale, string>> = {
  GLUTEN: { ka: 'გლუტენი', en: 'Gluten', ru: 'Глютен' },
  DAIRY: { ka: 'რძის პროდუქტები', en: 'Dairy', ru: 'Молочные' },
  EGGS: { ka: 'კვერცხი', en: 'Eggs', ru: 'Яйца' },
  NUTS: { ka: 'თხილეული', en: 'Tree Nuts', ru: 'Орехи' },
  PEANUTS: { ka: 'არაქისი', en: 'Peanuts', ru: 'Арахис' },
  SEAFOOD: { ka: 'ზღვის პროდუქტები', en: 'Seafood', ru: 'Морепродукты' },
  FISH: { ka: 'თევზი', en: 'Fish', ru: 'Рыба' },
  SHELLFISH: { ka: 'კიბორჩხალები', en: 'Shellfish', ru: 'Моллюски' },
  SOY: { ka: 'სოია', en: 'Soy', ru: 'Соя' },
  PORK: { ka: 'ღორის ხორცი', en: 'Pork', ru: 'Свинина' },
  SESAME: { ka: 'სეზამი', en: 'Sesame', ru: 'Кунжут' },
  MUSTARD: { ka: 'მდოგვი', en: 'Mustard', ru: 'Горчица' },
  CELERY: { ka: 'ნიახური', en: 'Celery', ru: 'Сельдерей' },
  LUPIN: { ka: 'ლუპინი', en: 'Lupin', ru: 'Люпин' },
  SULPHITES: { ka: 'სულფიტები', en: 'Sulphites', ru: 'Сульфиты' },
};

// Short-form (1-2 letter) codes for ICON/WARNING modes — restaurant standard
export const allergenShort: Record<string, string> = {
  GLUTEN: 'G',
  DAIRY: 'D',
  EGGS: 'E',
  NUTS: 'N',
  PEANUTS: 'Pn',
  SEAFOOD: 'Sf',
  FISH: 'F',
  SHELLFISH: 'Sh',
  SOY: 'Sy',
  PORK: 'Po',
  SESAME: 'Sm',
  MUSTARD: 'M',
  CELERY: 'C',
  LUPIN: 'L',
  SULPHITES: 'Su',
};

// ── Ribbons ──────────────────────────────────────────────────────
export const ribbonLabels: Record<string, Record<Locale, string>> = {
  POPULAR: { ka: 'პოპულარული', en: 'Popular', ru: 'Популярное' },
  CHEF_CHOICE: { ka: 'შეფის რჩევა', en: "Chef's Pick", ru: 'Выбор шефа' },
  DAILY_DISH: { ka: 'დღის კერძი', en: 'Today', ru: 'Блюдо дня' },
  NEW: { ka: 'ახალი', en: 'New', ru: 'Новое' },
  SPICY: { ka: 'ცხარე', en: 'Spicy', ru: 'Острое' },
};

// Muted, restrained pill colors — not neon/AI-style
export const ribbonPillClass: Record<string, string> = {
  POPULAR:
    'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900',
  CHEF_CHOICE:
    'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900',
  DAILY_DISH:
    'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900',
  NEW:
    'bg-sky-50 text-sky-800 ring-1 ring-inset ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900',
  SPICY:
    'bg-orange-50 text-orange-800 ring-1 ring-inset ring-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-900',
};

// For overlay on image (darker variants that work on photos)
export const ribbonOverlayClass: Record<string, string> = {
  POPULAR: 'bg-red-500/95 text-white',
  CHEF_CHOICE: 'bg-amber-500/95 text-white',
  DAILY_DISH: 'bg-emerald-600/95 text-white',
  NEW: 'bg-sky-500/95 text-white',
  SPICY: 'bg-orange-500/95 text-white',
};

// Importance order — show only the top-priority ribbon first when space-constrained
export const ribbonPriority: Record<string, number> = {
  DAILY_DISH: 5,
  CHEF_CHOICE: 4,
  POPULAR: 3,
  NEW: 2,
  SPICY: 1,
};

export function sortRibbons(ribbons: string[]): string[] {
  return [...ribbons].sort((a, b) => (ribbonPriority[b] ?? 0) - (ribbonPriority[a] ?? 0));
}

// ── Touch effects ───────────────────────────────────────────────
export const touchEffectClasses: Record<
  NonNullable<PublicDisplaySettings['productTouchEffect']>,
  string
> = {
  SCALE: 'transition-transform duration-200 active:scale-[0.98] hover:shadow-md',
  GLOW: 'transition-shadow duration-200 hover:shadow-[0_0_20px_rgba(0,0,0,0.08)]',
  GRADIENT:
    'transition-colors duration-200 hover:bg-gradient-to-br hover:from-muted/30 hover:to-transparent',
  NONE: '',
};

// ── Locale helpers ──────────────────────────────────────────────
export function getProductName(p: PublicProduct, locale: Locale): string {
  switch (locale) {
    case 'en':
      return p.nameEn || p.nameKa;
    case 'ru':
      return p.nameRu || p.nameKa;
    default:
      return p.nameKa;
  }
}

export function getProductDescription(
  p: PublicProduct,
  locale: Locale
): string | null {
  switch (locale) {
    case 'en':
      return p.descriptionEn || p.descriptionKa;
    case 'ru':
      return p.descriptionRu || p.descriptionKa;
    default:
      return p.descriptionKa;
  }
}

export function getVariationName(
  v: PublicProduct['variations'][number],
  locale: Locale
): string {
  switch (locale) {
    case 'en':
      return v.nameEn || v.nameKa;
    case 'ru':
      return v.nameRu || v.nameKa;
    default:
      return v.nameKa;
  }
}

export function toNumber(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

// Format price with tabular numbers styling (space before currency like "18.50 ₾")
export function formatPriceNum(price: number, symbol: string): string {
  // Strip trailing .00 for whole numbers? No — consistent 2 decimals reads as price.
  return `${price.toFixed(2)} ${symbol}`;
}
