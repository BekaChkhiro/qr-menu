'use client';

import { useSession } from 'next-auth/react';
import type { Plan } from '@prisma/client';
import {
  PLAN_LIMITS,
  PLAN_FEATURES,
  type PlanFeature,
} from '@/lib/auth/permissions';

type PlanLimits = (typeof PLAN_LIMITS)[Plan];
type PlanFeatures = (typeof PLAN_FEATURES)[Plan];

interface UseUserPlanReturn {
  plan: Plan;
  isLoading: boolean;
  limits: PlanLimits;
  features: PlanFeatures;
  hasFeature: (feature: PlanFeature) => boolean;
  canCreate: (resource: 'menu' | 'category' | 'product', currentCount: number) => boolean;
  getRemaining: (resource: 'menu' | 'category' | 'product', currentCount: number) => number;
  getLimit: (resource: 'menu' | 'category' | 'product') => number;
}

export function useUserPlan(): UseUserPlanReturn {
  const { data: session, status } = useSession();
  const plan = (session?.user?.plan as Plan) || 'FREE';
  const isLoading = status === 'loading';

  const limits = PLAN_LIMITS[plan];
  const features = PLAN_FEATURES[plan];

  const hasFeature = (feature: PlanFeature): boolean => {
    return features[feature];
  };

  const getLimit = (resource: 'menu' | 'category' | 'product'): number => {
    switch (resource) {
      case 'menu':
        return limits.maxMenus;
      case 'category':
        return limits.maxCategories;
      case 'product':
        return limits.maxProducts;
    }
  };

  const canCreate = (
    resource: 'menu' | 'category' | 'product',
    currentCount: number
  ): boolean => {
    const limit = getLimit(resource);
    return limit === Infinity || currentCount < limit;
  };

  const getRemaining = (
    resource: 'menu' | 'category' | 'product',
    currentCount: number
  ): number => {
    const limit = getLimit(resource);
    if (limit === Infinity) return Infinity;
    return Math.max(0, limit - currentCount);
  };

  return {
    plan,
    isLoading,
    limits,
    features,
    hasFeature,
    canCreate,
    getRemaining,
    getLimit,
  };
}
