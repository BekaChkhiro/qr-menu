'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/query-keys';
import type {
  Menu,
  MenuWithDetails,
  MenuFilters,
  PaginatedMenus,
} from '@/types/menu';
import type {
  CreateMenuInput,
  UpdateMenuInput,
} from '@/lib/validations/menu';

/**
 * Hook to fetch paginated list of menus
 */
export function useMenus(filters?: MenuFilters) {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.set('page', String(filters.page));
  if (filters?.limit) queryParams.set('limit', String(filters.limit));
  if (filters?.status) queryParams.set('status', filters.status);

  const queryString = queryParams.toString();
  const endpoint = `/menus${queryString ? `?${queryString}` : ''}`;

  return useQuery<PaginatedMenus, ApiError>({
    queryKey: queryKeys.menus.list(filters),
    queryFn: async () => {
      const response = await api.getPaginated<Menu>(endpoint);
      return {
        data: response.data,
        pagination: response.pagination,
      };
    },
  });
}

/**
 * Hook to fetch a single menu by ID
 */
export function useMenu(menuId: string | undefined) {
  return useQuery<MenuWithDetails, ApiError>({
    queryKey: queryKeys.menus.detail(menuId!),
    queryFn: () => api.get<MenuWithDetails>(`/menus/${menuId}`),
    enabled: !!menuId,
  });
}

/**
 * Hook to create a new menu
 */
export function useCreateMenu() {
  const queryClient = useQueryClient();

  return useMutation<Menu, ApiError, CreateMenuInput>({
    mutationFn: (data) => api.post<Menu>('/menus', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.all });
    },
  });
}

/**
 * Hook to update a menu
 */
export function useUpdateMenu(menuId: string) {
  const queryClient = useQueryClient();

  return useMutation<Menu, ApiError, UpdateMenuInput>({
    mutationFn: (data) => api.put<Menu>(`/menus/${menuId}`, data),
    onSuccess: (updatedMenu) => {
      queryClient.setQueryData(
        queryKeys.menus.detail(menuId),
        (oldData: MenuWithDetails | undefined) =>
          oldData ? { ...oldData, ...updatedMenu } : undefined
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.lists() });
    },
  });
}

/**
 * Hook to delete a menu
 */
export function useDeleteMenu() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (menuId) => api.delete(`/menus/${menuId}`),
    onSuccess: (_, menuId) => {
      queryClient.removeQueries({ queryKey: queryKeys.menus.detail(menuId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.lists() });
    },
  });
}

/**
 * Hook to publish/unpublish a menu
 */
export function usePublishMenu(menuId: string) {
  const queryClient = useQueryClient();

  return useMutation<Menu, ApiError, boolean>({
    mutationFn: (publish) =>
      api.post<Menu>(`/menus/${menuId}/publish`, { publish }),
    onSuccess: (updatedMenu) => {
      queryClient.setQueryData(
        queryKeys.menus.detail(menuId),
        (oldData: MenuWithDetails | undefined) =>
          oldData ? { ...oldData, ...updatedMenu } : undefined
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.lists() });
    },
  });
}
