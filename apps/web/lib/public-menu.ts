import { prisma } from '@/lib/db';
import { cacheGetOrSet, CACHE_KEYS, CACHE_TTL } from '@/lib/cache/redis';
import { isWithinWindows } from '@/lib/promotions/time-windows';

// Shared select shape for menu fetch queries — kept identical between the
// public page (`/m/[slug]`) and the table-mode page (`/m/[slug]/t/[code]`).
export const publicMenuSelect = {
  id: true,
  name: true,
  // T21.2 — multilingual menu name; resolved by active locale at the page level.
  nameKa: true,
  nameEn: true,
  nameRu: true,
  slug: true,
  description: true,
  logoUrl: true,
  logoSize: true,
  logoAlignment: true,
  primaryColor: true,
  accentColor: true,
  currencySymbol: true,
  headingFont: true,
  bodyFont: true,
  cornerRadius: true,
  enabledLanguages: true,
  allergenDisplay: true,
  caloriesDisplay: true,
  showNutrition: true,
  showDiscount: true,
  promoPopupEnabled: true,
  timezone: true,
  splitByType: true,
  menuLayout: true,
  menuTemplate: true,
  productCardStyle: true,
  productTouchEffect: true,
  address: true,
  phone: true,
  wifiSsid: true,
  wifiPassword: true,
  wcDirection: true,
  wcImageUrl: true,
  locationLat: true,
  locationLng: true,
  status: true,
  publishedAt: true,
  passwordHash: true,
  sharedTableEnabled: true,
  categories: {
    orderBy: { sortOrder: 'asc' as const },
    select: {
      id: true,
      nameKa: true,
      nameEn: true,
      nameRu: true,
      descriptionKa: true,
      descriptionEn: true,
      descriptionRu: true,
      iconUrl: true,
      brandLabel: true,
      type: true,
      sortOrder: true,
      products: {
        where: { isAvailable: true },
        orderBy: { sortOrder: 'asc' as const },
        select: {
          id: true,
          nameKa: true,
          nameEn: true,
          nameRu: true,
          descriptionKa: true,
          descriptionEn: true,
          descriptionRu: true,
          price: true,
          oldPrice: true,
          // T22.23 — dish discount windows gate the discount by day/hour.
          discountWindows: true,
          currency: true,
          imageUrl: true,
          imageFocalX: true,
          imageFocalY: true,
          imageZoom: true,
          allergens: true,
          ribbons: true,
          isVegan: true,
          isVegetarian: true,
          calories: true,
          protein: true,
          fats: true,
          carbs: true,
          fiber: true,
          arEnabled: true,
          arModelUrl: true,
          arModelUrlIos: true,
          arPosterUrl: true,
          sortOrder: true,
          variations: {
            orderBy: { sortOrder: 'asc' as const },
            select: {
              id: true,
              nameKa: true,
              nameEn: true,
              nameRu: true,
              price: true,
              sortOrder: true,
            },
          },
        },
      },
    },
  },
  promotions: {
    where: {
      isActive: true,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
    },
    orderBy: [{ sortOrder: 'asc' as const }, { startDate: 'asc' as const }],
    select: {
      id: true,
      titleKa: true,
      titleEn: true,
      titleRu: true,
      descriptionKa: true,
      descriptionEn: true,
      descriptionRu: true,
      imageUrl: true,
      startDate: true,
      endDate: true,
      sortOrder: true,
      // T22.18 — scope + discount config needed to apply category/menu-wide
      // promotions to public product prices (not just the carousel banner).
      discountType: true,
      discountValue: true,
      applyTo: true,
      categoryId: true,
      // T22.19/T22.20 — type + appearance for the public carousel variants.
      type: true,
      backgroundColor: true,
      showTitle: true,
      timeRestrictions: true,
    },
  },
};

export async function getPublicMenu(slug: string) {
  return cacheGetOrSet(
    CACHE_KEYS.publicMenu(slug),
    async () => {
      return prisma.menu.findUnique({
        where: { slug, status: 'PUBLISHED' },
        select: publicMenuSelect,
      });
    },
    CACHE_TTL.PUBLIC_MENU,
  );
}

export async function getPreviewMenu(slug: string, userId: string) {
  return prisma.menu.findUnique({
    where: { slug, userId },
    select: publicMenuSelect,
  });
}

export type RawPublicMenu = NonNullable<Awaited<ReturnType<typeof getPublicMenu>>>;

// T21.2 — pick the menu name in the visitor's active locale, falling back
// to Georgian when the requested translation is missing or empty.
export function pickLocalizedMenuName(
  menu: { nameKa: string; nameEn: string | null; nameRu: string | null },
  locale: 'ka' | 'en' | 'ru',
): string {
  if (locale === 'en') return menu.nameEn?.trim() || menu.nameKa;
  if (locale === 'ru') return menu.nameRu?.trim() || menu.nameKa;
  return menu.nameKa;
}

// Serialized shape — Decimals/Dates become primitive strings/numbers after the
// JSON.parse(JSON.stringify(...)) round-trip used to ship data into client islands.
export interface SerializedPublicMenu {
  id: string;
  name: string;
  // T21.2 — multilingual menu name (KA always present; EN/RU optional).
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  logoSize: 'SMALL' | 'MEDIUM' | 'LARGE';
  logoAlignment: 'LEFT' | 'CENTER' | 'RIGHT';
  primaryColor: string | null;
  accentColor: string | null;
  currencySymbol: string | null;
  headingFont: string | null;
  bodyFont: string | null;
  cornerRadius: number | null;
  enabledLanguages: string[];
  allergenDisplay: 'TEXT' | 'ICON' | 'WARNING';
  caloriesDisplay: 'DIRECT' | 'FLIP_REVEAL' | 'HIDDEN';
  showNutrition: boolean;
  showDiscount: boolean;
  promoPopupEnabled: boolean;
  // T22.21 — café-local timezone that day/hour windows are evaluated against.
  timezone: string;
  splitByType: boolean;
  menuLayout: 'LINEAR' | 'CATEGORIES_FIRST';
  menuTemplate: 'CLASSIC' | 'MAGAZINE' | 'COMPACT';
  productCardStyle: 'FLAT' | 'BORDERED' | 'ELEVATED' | 'MINIMAL';
  productTouchEffect: 'NONE' | 'SCALE' | 'GLOW' | 'GRADIENT';
  address: string | null;
  phone: string | null;
  wifiSsid: string | null;
  wifiPassword: string | null;
  wcDirection: string | null;
  wcImageUrl: string | null;
  locationLat: number | string | null;
  locationLng: number | string | null;
  status: string;
  publishedAt: string | null;
  sharedTableEnabled: boolean;
  categories: SerializedPublicCategory[];
  promotions: SerializedPublicPromotion[];
}

export interface SerializedPublicCategory {
  id: string;
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
  descriptionKa: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  iconUrl: string | null;
  brandLabel: string | null;
  type: 'FOOD' | 'DRINK' | 'OTHER';
  sortOrder: number;
  products: SerializedPublicProduct[];
}

export interface SerializedPublicProduct {
  id: string;
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
  descriptionKa: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  price: number | string;
  oldPrice: number | string | null;
  // T22.23 — per-day windows restricting when the dish discount applies.
  discountWindows: {
    enabled?: boolean;
    windows?: Record<string, { start: string; end: string }>;
  } | null;
  currency: string;
  imageUrl: string | null;
  imageFocalX: number | null;
  imageFocalY: number | null;
  imageZoom: number | null;
  allergens: string[];
  ribbons: string[];
  isVegan: boolean;
  isVegetarian: boolean;
  calories: number | null;
  protein: number | string | null;
  fats: number | string | null;
  carbs: number | string | null;
  fiber: number | string | null;
  arEnabled: boolean;
  arModelUrl: string | null;
  arModelUrlIos: string | null;
  arPosterUrl: string | null;
  sortOrder: number;
  variations: SerializedPublicVariation[];
}

export interface SerializedPublicVariation {
  id: string;
  nameKa: string;
  nameEn: string | null;
  nameRu: string | null;
  price: number | string;
  sortOrder: number;
}

export interface SerializedPublicPromotion {
  id: string;
  titleKa: string;
  titleEn: string | null;
  titleRu: string | null;
  descriptionKa: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  sortOrder: number;
  // T22.18 — scope + discount config (null on legacy banner-only promotions).
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_ADDON' | null;
  discountValue: number | string | null;
  applyTo: 'ENTIRE_MENU' | 'CATEGORY' | 'SPECIFIC_ITEMS' | null;
  categoryId: string | null;
  // T22.19/T22.20 — type + appearance.
  type: 'PERCENTAGE' | 'BANNER' | 'COMBO' | null;
  backgroundColor: string | null;
  showTitle: boolean;
  // T22.21 — per-day windows; legacy rows may still carry the flat shape.
  timeRestrictions: {
    enabled?: boolean;
    windows?: Record<string, { start: string; end: string }>;
    days?: string[];
    startTime?: string;
    endTime?: string;
  } | null;
}

// ── T22.18 — apply category / menu-wide promotions to public prices ──────────
//
// Bug fix: a promotion scoped to a category (or the whole menu) was stored but
// never affected the prices shown on the public menu — it only appeared as a
// carousel banner. This transform walks the serialized menu and lowers product
// prices for any active PERCENTAGE / FIXED_AMOUNT promotion that targets the
// whole menu or the product's category.
//
// Conflict rule (spec "last wins"): a product that already carries a manual
// `oldPrice` (a per-dish discount set in the product editor) is left untouched —
// the dish-level discount wins over the category promotion. When multiple
// promotions apply to the same product, the one yielding the lowest final price
// wins. FREE_ADDON / banner-info promotions never change prices.
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function discountedPrice(
  price: number,
  promo: Pick<SerializedPublicPromotion, 'discountType' | 'discountValue'>,
): number | null {
  const value = promo.discountValue == null ? NaN : Number(promo.discountValue);
  if (!Number.isFinite(value) || value <= 0) return null;
  if (promo.discountType === 'PERCENTAGE') {
    const pct = Math.min(100, value);
    return round2(price * (1 - pct / 100));
  }
  if (promo.discountType === 'FIXED_AMOUNT') {
    return round2(Math.max(0, price - value));
  }
  return null; // FREE_ADDON / null → no price effect
}

// T22.21 — a promotion is live only inside its configured day/hour windows,
// evaluated against the café's local clock. Used for both the carousel and the
// price transform so a "Mon 12:00–14:00" promotion is genuinely off at 15:00.
export function isPromotionLive(
  promo: Pick<SerializedPublicPromotion, 'timeRestrictions'>,
  timezone: string,
  now: Date = new Date(),
): boolean {
  return isWithinWindows(promo.timeRestrictions, now, timezone);
}

/** Promotions to show in the public carousel / pop-up right now. */
export function livePromotions(
  menu: SerializedPublicMenu,
  now: Date = new Date(),
): SerializedPublicPromotion[] {
  return menu.promotions.filter((p) => isPromotionLive(p, menu.timezone, now));
}

// T22.23 — a dish discount can be restricted to certain days/hours. Outside its
// window the discount must not apply, so we revert the card to the original
// price (price = oldPrice, no strikethrough). Run this BEFORE
// applyPromotionPricing: a dish whose own discount is off-hours becomes
// eligible for a category/menu promotion again.
export function applyDishDiscountWindows(
  menu: SerializedPublicMenu,
  now: Date = new Date(),
): SerializedPublicMenu {
  for (const category of menu.categories) {
    for (const product of category.products) {
      const windows = product.discountWindows;
      if (!windows?.enabled) continue;
      if (isWithinWindows(windows, now, menu.timezone)) continue;

      // Off-hours → restore the original price.
      const original = product.oldPrice == null ? null : Number(product.oldPrice);
      if (original != null && Number.isFinite(original) && original > 0) {
        product.price = original;
        product.oldPrice = null;
      }
    }
  }
  return menu;
}

export function applyPromotionPricing(
  menu: SerializedPublicMenu,
  now: Date = new Date(),
): SerializedPublicMenu {
  const pricing = menu.promotions.filter(
    (p) =>
      (p.discountType === 'PERCENTAGE' || p.discountType === 'FIXED_AMOUNT') &&
      (p.applyTo === 'ENTIRE_MENU' || (p.applyTo === 'CATEGORY' && !!p.categoryId)) &&
      // Outside its day/hour window the discount must not touch prices.
      isPromotionLive(p, menu.timezone, now),
  );
  if (pricing.length === 0) return menu;

  const menuWide = pricing.filter((p) => p.applyTo === 'ENTIRE_MENU');

  for (const category of menu.categories) {
    const applicable = [
      ...menuWide,
      ...pricing.filter((p) => p.applyTo === 'CATEGORY' && p.categoryId === category.id),
    ];
    if (applicable.length === 0) continue;

    for (const product of category.products) {
      // Dish-level manual discount wins — never override an existing oldPrice.
      if (product.oldPrice != null && Number(product.oldPrice) > 0) continue;

      const base = Number(product.price);
      if (!Number.isFinite(base) || base <= 0) continue;

      let best = base;
      for (const promo of applicable) {
        const final = discountedPrice(base, promo);
        if (final != null && final < best) best = final;
      }

      if (best < base) {
        product.oldPrice = base;
        product.price = best;
      }
    }
  }

  return menu;
}
