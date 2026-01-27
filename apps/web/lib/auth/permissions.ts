import type { Plan } from '@prisma/client';

export const PLAN_LIMITS = {
  FREE: {
    maxMenus: 1,
    maxCategories: 3,
    maxProducts: 15,
  },
  STARTER: {
    maxMenus: 3,
    maxCategories: Infinity,
    maxProducts: Infinity,
  },
  PRO: {
    maxMenus: Infinity,
    maxCategories: Infinity,
    maxProducts: Infinity,
  },
} as const;

export const PLAN_FEATURES = {
  FREE: {
    basicQR: true,
    promotions: false,
    customBranding: false,
    customColors: false,
    multilingual: false,
    allergens: false,
    analytics: false,
    qrWithLogo: false,
  },
  STARTER: {
    basicQR: true,
    promotions: true,
    customBranding: true,
    customColors: true,
    multilingual: false,
    allergens: false,
    analytics: false,
    qrWithLogo: false,
  },
  PRO: {
    basicQR: true,
    promotions: true,
    customBranding: true,
    customColors: true,
    multilingual: true,
    allergens: true,
    analytics: true,
    qrWithLogo: true,
  },
} as const;

export type PlanFeature = keyof (typeof PLAN_FEATURES)['FREE'];

interface UserWithPlan {
  plan: Plan;
}

interface UserWithMenuCount extends UserWithPlan {
  _count?: {
    menus: number;
  };
  menus?: { id: string }[];
}

export function canCreateMenu(user: UserWithMenuCount): boolean {
  const menuCount = user._count?.menus ?? user.menus?.length ?? 0;
  const limit = PLAN_LIMITS[user.plan].maxMenus;
  return menuCount < limit;
}

export function canCreateCategory(
  user: UserWithPlan,
  currentCategoryCount: number
): boolean {
  const limit = PLAN_LIMITS[user.plan].maxCategories;
  return currentCategoryCount < limit;
}

export function canCreateProduct(
  user: UserWithPlan,
  currentProductCount: number
): boolean {
  const limit = PLAN_LIMITS[user.plan].maxProducts;
  return currentProductCount < limit;
}

export function hasFeature(plan: Plan, feature: PlanFeature): boolean {
  return PLAN_FEATURES[plan][feature];
}

export function getRemainingMenus(user: UserWithMenuCount): number {
  const menuCount = user._count?.menus ?? user.menus?.length ?? 0;
  const limit = PLAN_LIMITS[user.plan].maxMenus;
  if (limit === Infinity) return Infinity;
  return Math.max(0, limit - menuCount);
}

export function getRemainingCategories(
  user: UserWithPlan,
  currentCategoryCount: number
): number {
  const limit = PLAN_LIMITS[user.plan].maxCategories;
  if (limit === Infinity) return Infinity;
  return Math.max(0, limit - currentCategoryCount);
}

export function getRemainingProducts(
  user: UserWithPlan,
  currentProductCount: number
): number {
  const limit = PLAN_LIMITS[user.plan].maxProducts;
  if (limit === Infinity) return Infinity;
  return Math.max(0, limit - currentProductCount);
}
