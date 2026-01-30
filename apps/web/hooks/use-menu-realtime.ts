'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeToMenu, isPusherClientAvailable } from '@/lib/pusher/client';
import { queryKeys } from '@/lib/query/query-keys';
import type { Menu, MenuWithDetails, Category, Product, Promotion } from '@/types/menu';

interface UseMenuRealtimeOptions {
  /** Enable/disable the subscription */
  enabled?: boolean;
  /** Callback when any real-time event is received */
  onEvent?: (eventType: string, data: unknown) => void;
}

/**
 * Hook to subscribe to real-time updates for a menu.
 * Automatically updates TanStack Query cache when events are received.
 */
export function useMenuRealtime(
  menuId: string | undefined,
  options: UseMenuRealtimeOptions = {}
) {
  const { enabled = true, onEvent } = options;
  const queryClient = useQueryClient();
  const onEventRef = useRef(onEvent);

  // Keep callback ref updated
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  // Menu event handlers
  const handleMenuUpdated = useCallback(
    (data: unknown) => {
      const menu = data as Menu;
      queryClient.setQueryData(
        queryKeys.menus.detail(menuId!),
        (oldData: MenuWithDetails | undefined) =>
          oldData ? { ...oldData, ...menu } : undefined
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.lists() });
      onEventRef.current?.('menu:updated', data);
    },
    [queryClient, menuId]
  );

  const handleMenuPublished = useCallback(
    (data: unknown) => {
      const menu = data as Menu;
      queryClient.setQueryData(
        queryKeys.menus.detail(menuId!),
        (oldData: MenuWithDetails | undefined) =>
          oldData ? { ...oldData, ...menu } : undefined
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.lists() });
      onEventRef.current?.('menu:published', data);
    },
    [queryClient, menuId]
  );

  const handleMenuUnpublished = useCallback(
    (data: unknown) => {
      const menu = data as Menu;
      queryClient.setQueryData(
        queryKeys.menus.detail(menuId!),
        (oldData: MenuWithDetails | undefined) =>
          oldData ? { ...oldData, ...menu } : undefined
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.menus.lists() });
      onEventRef.current?.('menu:unpublished', data);
    },
    [queryClient, menuId]
  );

  // Category event handlers
  const handleCategoryCreated = useCallback(
    (data: unknown) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories.list(menuId!),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.menus.detail(menuId!),
      });
      onEventRef.current?.('category:created', data);
    },
    [queryClient, menuId]
  );

  const handleCategoryUpdated = useCallback(
    (data: unknown) => {
      const category = data as Category;
      queryClient.setQueryData(
        queryKeys.categories.detail(category.id),
        category
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories.list(menuId!),
      });
      onEventRef.current?.('category:updated', data);
    },
    [queryClient, menuId]
  );

  const handleCategoryDeleted = useCallback(
    (data: unknown) => {
      const { id } = data as { id: string };
      queryClient.removeQueries({
        queryKey: queryKeys.categories.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories.list(menuId!),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.menus.detail(menuId!),
      });
      onEventRef.current?.('category:deleted', data);
    },
    [queryClient, menuId]
  );

  const handleCategoryReordered = useCallback(
    (data: unknown) => {
      const categories = data as Category[];
      queryClient.setQueryData(
        queryKeys.categories.list(menuId!),
        categories
      );
      onEventRef.current?.('category:reordered', data);
    },
    [queryClient, menuId]
  );

  // Product event handlers
  const handleProductCreated = useCallback(
    (data: unknown) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.list(menuId!),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.menus.detail(menuId!),
      });
      onEventRef.current?.('product:created', data);
    },
    [queryClient, menuId]
  );

  const handleProductUpdated = useCallback(
    (data: unknown) => {
      const product = data as Product;
      queryClient.setQueryData(
        queryKeys.products.detail(product.id),
        product
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.list(menuId!),
      });
      onEventRef.current?.('product:updated', data);
    },
    [queryClient, menuId]
  );

  const handleProductDeleted = useCallback(
    (data: unknown) => {
      const { id } = data as { id: string };
      queryClient.removeQueries({
        queryKey: queryKeys.products.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.list(menuId!),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.menus.detail(menuId!),
      });
      onEventRef.current?.('product:deleted', data);
    },
    [queryClient, menuId]
  );

  const handleProductReordered = useCallback(
    (data: unknown) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.list(menuId!),
      });
      onEventRef.current?.('product:reordered', data);
    },
    [queryClient, menuId]
  );

  // Promotion event handlers
  const handlePromotionCreated = useCallback(
    (data: unknown) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.promotions.list(menuId!),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.menus.detail(menuId!),
      });
      onEventRef.current?.('promotion:created', data);
    },
    [queryClient, menuId]
  );

  const handlePromotionUpdated = useCallback(
    (data: unknown) => {
      const promotion = data as Promotion;
      queryClient.setQueryData(
        queryKeys.promotions.detail(promotion.id),
        promotion
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.promotions.list(menuId!),
      });
      onEventRef.current?.('promotion:updated', data);
    },
    [queryClient, menuId]
  );

  const handlePromotionDeleted = useCallback(
    (data: unknown) => {
      const { id } = data as { id: string };
      queryClient.removeQueries({
        queryKey: queryKeys.promotions.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.promotions.list(menuId!),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.menus.detail(menuId!),
      });
      onEventRef.current?.('promotion:deleted', data);
    },
    [queryClient, menuId]
  );

  // Subscribe to Pusher channel
  useEffect(() => {
    if (!menuId || !enabled || !isPusherClientAvailable()) {
      return;
    }

    const unsubscribe = subscribeToMenu(menuId, {
      onMenuUpdated: handleMenuUpdated,
      onMenuPublished: handleMenuPublished,
      onMenuUnpublished: handleMenuUnpublished,
      onCategoryCreated: handleCategoryCreated,
      onCategoryUpdated: handleCategoryUpdated,
      onCategoryDeleted: handleCategoryDeleted,
      onCategoryReordered: handleCategoryReordered,
      onProductCreated: handleProductCreated,
      onProductUpdated: handleProductUpdated,
      onProductDeleted: handleProductDeleted,
      onProductReordered: handleProductReordered,
      onPromotionCreated: handlePromotionCreated,
      onPromotionUpdated: handlePromotionUpdated,
      onPromotionDeleted: handlePromotionDeleted,
    });

    return () => {
      unsubscribe?.();
    };
  }, [
    menuId,
    enabled,
    handleMenuUpdated,
    handleMenuPublished,
    handleMenuUnpublished,
    handleCategoryCreated,
    handleCategoryUpdated,
    handleCategoryDeleted,
    handleCategoryReordered,
    handleProductCreated,
    handleProductUpdated,
    handleProductDeleted,
    handleProductReordered,
    handlePromotionCreated,
    handlePromotionUpdated,
    handlePromotionDeleted,
  ]);

  return {
    isConnected: isPusherClientAvailable(),
  };
}
