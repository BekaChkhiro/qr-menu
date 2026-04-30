import { prisma } from '@/lib/db';
import { cacheGetOrSet, CACHE_KEYS, CACHE_TTL } from '@/lib/cache/redis';

// Shared select shape for menu fetch queries — kept identical between the
// public page (`/m/[slug]`) and the table-mode page (`/m/[slug]/t/[code]`).
export const publicMenuSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  logoUrl: true,
  primaryColor: true,
  accentColor: true,
  currencySymbol: true,
  headingFont: true,
  bodyFont: true,
  enabledLanguages: true,
  allergenDisplay: true,
  caloriesDisplay: true,
  showNutrition: true,
  showDiscount: true,
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

// Serialized shape — Decimals/Dates become primitive strings/numbers after the
// JSON.parse(JSON.stringify(...)) round-trip used to ship data into client islands.
export interface SerializedPublicMenu {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  currencySymbol: string | null;
  headingFont: string | null;
  bodyFont: string | null;
  enabledLanguages: string[];
  allergenDisplay: 'TEXT' | 'ICON' | 'WARNING';
  caloriesDisplay: 'DIRECT' | 'FLIP_REVEAL' | 'HIDDEN';
  showNutrition: boolean;
  showDiscount: boolean;
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
}
