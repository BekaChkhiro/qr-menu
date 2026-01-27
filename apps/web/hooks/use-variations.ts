'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/query-keys';
import type { ProductVariation } from '@/types/menu';
import type {
  CreateProductVariationInput,
  UpdateProductVariationInput,
  BulkCreateVariationsInput,
  ReorderVariationsInput,
} from '@/lib/validations/product-variation';

/**
 * Hook to fetch all variations for a product
 */
export function useVariations(menuId: string | undefined, productId: string | undefined) {
  return useQuery<ProductVariation[], ApiError>({
    queryKey: queryKeys.variations.list(productId!),
    queryFn: () =>
      api.get<ProductVariation[]>(`/menus/${menuId}/products/${productId}/variations`),
    enabled: !!menuId && !!productId,
  });
}

/**
 * Hook to fetch a single variation by ID
 */
export function useVariation(
  menuId: string | undefined,
  productId: string | undefined,
  variationId: string | undefined
) {
  return useQuery<ProductVariation, ApiError>({
    queryKey: queryKeys.variations.detail(variationId!),
    queryFn: () =>
      api.get<ProductVariation>(
        `/menus/${menuId}/products/${productId}/variations/${variationId}`
      ),
    enabled: !!menuId && !!productId && !!variationId,
  });
}

/**
 * Hook to create a new variation
 */
export function useCreateVariation(menuId: string, productId: string) {
  const queryClient = useQueryClient();

  return useMutation<ProductVariation, ApiError, CreateProductVariationInput>({
    mutationFn: (data) =>
      api.post<ProductVariation>(
        `/menus/${menuId}/products/${productId}/variations`,
        data
      ),
    onSuccess: () => {
      // Invalidate variations list
      queryClient.invalidateQueries({ queryKey: queryKeys.variations.list(productId) });
      // Invalidate product detail to update variation count
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(productId) });
      // Invalidate product lists to update variation counts
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
}

/**
 * Hook to bulk create variations
 */
export function useBulkCreateVariations(menuId: string, productId: string) {
  const queryClient = useQueryClient();

  return useMutation<ProductVariation[], ApiError, BulkCreateVariationsInput>({
    mutationFn: (data) =>
      api.post<ProductVariation[]>(
        `/menus/${menuId}/products/${productId}/variations`,
        data
      ),
    onSuccess: () => {
      // Invalidate variations list
      queryClient.invalidateQueries({ queryKey: queryKeys.variations.list(productId) });
      // Invalidate product detail to update variation count
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(productId) });
      // Invalidate product lists to update variation counts
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
}

/**
 * Hook to update a variation
 */
export function useUpdateVariation(menuId: string, productId: string, variationId: string) {
  const queryClient = useQueryClient();

  return useMutation<ProductVariation, ApiError, UpdateProductVariationInput>({
    mutationFn: (data) =>
      api.put<ProductVariation>(
        `/menus/${menuId}/products/${productId}/variations/${variationId}`,
        data
      ),
    onSuccess: (updatedVariation) => {
      // Update variation detail cache
      queryClient.setQueryData(
        queryKeys.variations.detail(variationId),
        updatedVariation
      );
      // Invalidate variations list
      queryClient.invalidateQueries({ queryKey: queryKeys.variations.list(productId) });
      // Invalidate product detail
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(productId) });
      // Invalidate product lists
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
}

/**
 * Hook to delete a variation
 */
export function useDeleteVariation(menuId: string, productId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (variationId) =>
      api.delete(`/menus/${menuId}/products/${productId}/variations/${variationId}`),
    onSuccess: (_, variationId) => {
      // Remove variation from cache
      queryClient.removeQueries({ queryKey: queryKeys.variations.detail(variationId) });
      // Invalidate variations list
      queryClient.invalidateQueries({ queryKey: queryKeys.variations.list(productId) });
      // Invalidate product detail to update variation count
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(productId) });
      // Invalidate product lists to update variation counts
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
}

interface ReorderContext {
  previousVariations: ProductVariation[] | undefined;
}

/**
 * Hook to reorder variations (drag-drop)
 */
export function useReorderVariations(menuId: string, productId: string) {
  const queryClient = useQueryClient();

  return useMutation<ProductVariation[], ApiError, ReorderVariationsInput, ReorderContext>({
    mutationFn: (data) =>
      api.post<ProductVariation[]>(
        `/menus/${menuId}/products/${productId}/variations/reorder`,
        data
      ),
    onMutate: async (newOrder) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.variations.list(productId) });

      // Snapshot the previous value
      const previousVariations = queryClient.getQueryData<ProductVariation[]>(
        queryKeys.variations.list(productId)
      );

      // Optimistically update to the new value
      if (previousVariations) {
        const reorderedVariations = [...previousVariations].sort((a, b) => {
          const aOrder =
            newOrder.variations.find((v) => v.id === a.id)?.sortOrder ?? a.sortOrder;
          const bOrder =
            newOrder.variations.find((v) => v.id === b.id)?.sortOrder ?? b.sortOrder;
          return aOrder - bOrder;
        });
        queryClient.setQueryData(
          queryKeys.variations.list(productId),
          reorderedVariations
        );
      }

      return { previousVariations };
    },
    onError: (_err, _newOrder, context) => {
      // Roll back on error
      if (context?.previousVariations) {
        queryClient.setQueryData(
          queryKeys.variations.list(productId),
          context.previousVariations
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.variations.list(productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(productId) });
    },
  });
}
