'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/query-keys';
import type { Promotion } from '@/types/menu';
import type {
  CreatePromotionInput,
  UpdatePromotionInput,
} from '@/lib/validations/promotion';

interface PromotionFilters {
  isActive?: boolean;
  includeExpired?: boolean;
}

/**
 * Hook to fetch all promotions for a menu
 */
export function usePromotions(
  menuId: string | undefined,
  filters?: PromotionFilters
) {
  return useQuery<Promotion[], ApiError>({
    queryKey: queryKeys.promotions.list(menuId!, filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.set('isActive', String(filters.isActive));
      }
      if (filters?.includeExpired !== undefined) {
        params.set('includeExpired', String(filters.includeExpired));
      }

      const queryString = params.toString();
      const url = `/menus/${menuId}/promotions${queryString ? `?${queryString}` : ''}`;
      return api.get<Promotion[]>(url);
    },
    enabled: !!menuId,
  });
}

/**
 * Hook to fetch a single promotion by ID
 */
export function usePromotion(
  menuId: string | undefined,
  promotionId: string | undefined
) {
  return useQuery<Promotion, ApiError>({
    queryKey: queryKeys.promotions.detail(promotionId!),
    queryFn: () =>
      api.get<Promotion>(`/menus/${menuId}/promotions/${promotionId}`),
    enabled: !!menuId && !!promotionId,
  });
}

/**
 * Hook to create a new promotion
 */
export function useCreatePromotion(menuId: string) {
  const queryClient = useQueryClient();

  return useMutation<Promotion, ApiError, CreatePromotionInput>({
    mutationFn: (data) =>
      api.post<Promotion>(`/menus/${menuId}/promotions`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.promotions.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.menus.detail(menuId),
      });
    },
  });
}

/**
 * Hook to update a promotion
 */
export function useUpdatePromotion(menuId: string, promotionId: string) {
  const queryClient = useQueryClient();

  return useMutation<Promotion, ApiError, UpdatePromotionInput>({
    mutationFn: (data) =>
      api.put<Promotion>(`/menus/${menuId}/promotions/${promotionId}`, data),
    onSuccess: (updatedPromotion) => {
      queryClient.setQueryData(
        queryKeys.promotions.detail(promotionId),
        updatedPromotion
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.promotions.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.menus.detail(menuId),
      });
    },
  });
}

/**
 * Hook to delete a promotion
 */
export function useDeletePromotion(menuId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (promotionId) =>
      api.delete(`/menus/${menuId}/promotions/${promotionId}`),
    onSuccess: (_, promotionId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.promotions.detail(promotionId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.promotions.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.menus.detail(menuId),
      });
    },
  });
}
