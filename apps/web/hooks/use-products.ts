'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/query-keys';
import type { Product } from '@/types/menu';
import type {
  CreateProductInput,
  UpdateProductInput,
  ReorderProductsInput,
} from '@/lib/validations/product';

export interface ProductFilters {
  categoryId?: string;
  isAvailable?: boolean;
}

/**
 * Hook to fetch all products for a menu
 */
export function useProducts(menuId: string | undefined, filters?: ProductFilters) {
  return useQuery<Product[], ApiError>({
    queryKey: queryKeys.products.list(menuId!, filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.categoryId) params.set('categoryId', filters.categoryId);
      if (filters?.isAvailable !== undefined) params.set('isAvailable', String(filters.isAvailable));

      const queryString = params.toString();
      const url = `/menus/${menuId}/products${queryString ? `?${queryString}` : ''}`;
      return api.get<Product[]>(url);
    },
    enabled: !!menuId,
  });
}

/**
 * Hook to fetch products by category
 */
export function useProductsByCategory(menuId: string | undefined, categoryId: string | undefined) {
  return useQuery<Product[], ApiError>({
    queryKey: queryKeys.products.list(menuId!, { categoryId }),
    queryFn: () => api.get<Product[]>(`/menus/${menuId}/products?categoryId=${categoryId}`),
    enabled: !!menuId && !!categoryId,
  });
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(menuId: string | undefined, productId: string | undefined) {
  return useQuery<Product, ApiError>({
    queryKey: queryKeys.products.detail(productId!),
    queryFn: () => api.get<Product>(`/menus/${menuId}/products/${productId}`),
    enabled: !!menuId && !!productId,
  });
}

/**
 * Hook to create a new product
 */
export function useCreateProduct(menuId: string) {
  const queryClient = useQueryClient();

  return useMutation<Product, ApiError, CreateProductInput>({
    mutationFn: (data) => api.post<Product>(`/menus/${menuId}/products`, data),
    onSuccess: (newProduct) => {
      // Invalidate all product lists for this menu
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      // Invalidate categories to update product counts
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.list(menuId) });
      // Invalidate menu detail to update counts
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.detail(menuId) });
    },
  });
}

/**
 * Hook to update a product
 */
export function useUpdateProduct(menuId: string, productId: string) {
  const queryClient = useQueryClient();

  return useMutation<Product, ApiError, UpdateProductInput>({
    mutationFn: (data) => api.put<Product>(`/menus/${menuId}/products/${productId}`, data),
    onSuccess: (updatedProduct) => {
      // Update the product detail cache
      queryClient.setQueryData(
        queryKeys.products.detail(productId),
        updatedProduct
      );
      // Invalidate product lists
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      // Invalidate categories in case category changed
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.list(menuId) });
      // Invalidate menu detail
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.detail(menuId) });
    },
  });
}

/**
 * Hook to delete a product
 */
export function useDeleteProduct(menuId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (productId) => api.delete(`/menus/${menuId}/products/${productId}`),
    onSuccess: (_, productId) => {
      // Remove product from cache
      queryClient.removeQueries({ queryKey: queryKeys.products.detail(productId) });
      // Invalidate product lists
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      // Invalidate categories to update product counts
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.list(menuId) });
      // Invalidate menu detail
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.detail(menuId) });
    },
  });
}

interface ReorderContext {
  previousProducts: Product[] | undefined;
}

/**
 * Hook to reorder products (drag-drop)
 */
export function useReorderProducts(menuId: string, categoryId?: string) {
  const queryClient = useQueryClient();

  return useMutation<Product[], ApiError, ReorderProductsInput, ReorderContext>({
    mutationFn: (data) => api.post<Product[]>(`/menus/${menuId}/products/reorder`, data),
    onMutate: async (newOrder) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.products.lists() });

      // Snapshot the previous value
      const previousProducts = queryClient.getQueryData<Product[]>(
        queryKeys.products.list(menuId, categoryId ? { categoryId } : undefined)
      );

      // Optimistically update to the new value
      if (previousProducts) {
        const reorderedProducts = [...previousProducts].sort((a, b) => {
          const aOrder = newOrder.products.find((p) => p.id === a.id)?.sortOrder ?? a.sortOrder;
          const bOrder = newOrder.products.find((p) => p.id === b.id)?.sortOrder ?? b.sortOrder;
          return aOrder - bOrder;
        });
        queryClient.setQueryData(
          queryKeys.products.list(menuId, categoryId ? { categoryId } : undefined),
          reorderedProducts
        );
      }

      // Return a context object with the snapshotted value
      return { previousProducts };
    },
    onError: (_err, _newOrder, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProducts) {
        queryClient.setQueryData(
          queryKeys.products.list(menuId, categoryId ? { categoryId } : undefined),
          context.previousProducts
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.detail(menuId) });
    },
  });
}
