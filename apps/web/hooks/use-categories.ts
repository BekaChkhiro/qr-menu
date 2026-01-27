'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/query-keys';
import type { Category } from '@/types/menu';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  ReorderCategoriesInput,
} from '@/lib/validations/category';

/**
 * Hook to fetch all categories for a menu
 */
export function useCategories(menuId: string | undefined) {
  return useQuery<Category[], ApiError>({
    queryKey: queryKeys.categories.list(menuId!),
    queryFn: () => api.get<Category[]>(`/menus/${menuId}/categories`),
    enabled: !!menuId,
  });
}

/**
 * Hook to fetch a single category by ID
 */
export function useCategory(menuId: string | undefined, categoryId: string | undefined) {
  return useQuery<Category, ApiError>({
    queryKey: queryKeys.categories.detail(categoryId!),
    queryFn: () => api.get<Category>(`/menus/${menuId}/categories/${categoryId}`),
    enabled: !!menuId && !!categoryId,
  });
}

/**
 * Hook to create a new category
 */
export function useCreateCategory(menuId: string) {
  const queryClient = useQueryClient();

  return useMutation<Category, ApiError, CreateCategoryInput>({
    mutationFn: (data) => api.post<Category>(`/menus/${menuId}/categories`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.list(menuId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.detail(menuId) });
    },
  });
}

/**
 * Hook to update a category
 */
export function useUpdateCategory(menuId: string, categoryId: string) {
  const queryClient = useQueryClient();

  return useMutation<Category, ApiError, UpdateCategoryInput>({
    mutationFn: (data) => api.put<Category>(`/menus/${menuId}/categories/${categoryId}`, data),
    onSuccess: (updatedCategory) => {
      queryClient.setQueryData(
        queryKeys.categories.detail(categoryId),
        updatedCategory
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.list(menuId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.detail(menuId) });
    },
  });
}

/**
 * Hook to delete a category
 */
export function useDeleteCategory(menuId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (categoryId) => api.delete(`/menus/${menuId}/categories/${categoryId}`),
    onSuccess: (_, categoryId) => {
      queryClient.removeQueries({ queryKey: queryKeys.categories.detail(categoryId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.list(menuId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.detail(menuId) });
    },
  });
}

interface ReorderContext {
  previousCategories: Category[] | undefined;
}

/**
 * Hook to reorder categories (drag-drop)
 */
export function useReorderCategories(menuId: string) {
  const queryClient = useQueryClient();

  return useMutation<Category[], ApiError, ReorderCategoriesInput, ReorderContext>({
    mutationFn: (data) => api.post<Category[]>(`/menus/${menuId}/categories/reorder`, data),
    onMutate: async (newOrder) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.list(menuId) });

      // Snapshot the previous value
      const previousCategories = queryClient.getQueryData<Category[]>(
        queryKeys.categories.list(menuId)
      );

      // Optimistically update to the new value
      if (previousCategories) {
        const reorderedCategories = [...previousCategories].sort((a, b) => {
          const aOrder = newOrder.categories.find((c) => c.id === a.id)?.sortOrder ?? a.sortOrder;
          const bOrder = newOrder.categories.find((c) => c.id === b.id)?.sortOrder ?? b.sortOrder;
          return aOrder - bOrder;
        });
        queryClient.setQueryData(queryKeys.categories.list(menuId), reorderedCategories);
      }

      // Return a context object with the snapshotted value
      return { previousCategories };
    },
    onError: (_err, _newOrder, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCategories) {
        queryClient.setQueryData(
          queryKeys.categories.list(menuId),
          context.previousCategories
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.list(menuId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.detail(menuId) });
    },
  });
}
