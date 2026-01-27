/**
 * Query key factory for consistent cache key management
 * Following the query key factory pattern from TanStack Query docs
 */

export const queryKeys = {
  // Menu queries
  menus: {
    all: ['menus'] as const,
    lists: () => [...queryKeys.menus.all, 'list'] as const,
    list: (filters?: { status?: string; page?: number; limit?: number }) =>
      [...queryKeys.menus.lists(), filters] as const,
    details: () => [...queryKeys.menus.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.menus.details(), id] as const,
    bySlug: (slug: string) => [...queryKeys.menus.all, 'slug', slug] as const,
  },

  // Category queries
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: (menuId: string) => [...queryKeys.categories.lists(), menuId] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.categories.details(), id] as const,
  },

  // Product queries
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (menuId: string, filters?: { categoryId?: string; page?: number }) =>
      [...queryKeys.products.lists(), menuId, filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
  },

  // Product variation queries
  variations: {
    all: ['variations'] as const,
    lists: () => [...queryKeys.variations.all, 'list'] as const,
    list: (productId: string) => [...queryKeys.variations.lists(), productId] as const,
    details: () => [...queryKeys.variations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.variations.details(), id] as const,
  },

  // Promotion queries
  promotions: {
    all: ['promotions'] as const,
    lists: () => [...queryKeys.promotions.all, 'list'] as const,
    list: (menuId: string, filters?: { isActive?: boolean }) =>
      [...queryKeys.promotions.lists(), menuId, filters] as const,
    details: () => [...queryKeys.promotions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.promotions.details(), id] as const,
  },

  // Analytics queries
  analytics: {
    all: ['analytics'] as const,
    menu: (menuId: string) => [...queryKeys.analytics.all, menuId] as const,
    menuRange: (menuId: string, startDate: string, endDate: string) =>
      [...queryKeys.analytics.menu(menuId), startDate, endDate] as const,
  },

  // User queries
  user: {
    all: ['user'] as const,
    current: () => [...queryKeys.user.all, 'current'] as const,
    settings: () => [...queryKeys.user.all, 'settings'] as const,
  },
} as const;
