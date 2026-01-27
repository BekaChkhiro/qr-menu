'use client';

import PusherClient from 'pusher-js';

// Create Pusher client instance (lazy initialization)
let pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  if (typeof window === 'undefined') return null;
  if (pusherClient) return pusherClient;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    console.warn('Pusher client not configured');
    return null;
  }

  pusherClient = new PusherClient(key, {
    cluster,
    forceTLS: true,
  });

  return pusherClient;
}

/**
 * Subscribe to a menu channel
 */
export function subscribeToMenu(
  menuId: string,
  callbacks: {
    onMenuUpdated?: (data: unknown) => void;
    onCategoryCreated?: (data: unknown) => void;
    onCategoryUpdated?: (data: unknown) => void;
    onCategoryDeleted?: (data: unknown) => void;
    onCategoryReordered?: (data: unknown) => void;
    onProductCreated?: (data: unknown) => void;
    onProductUpdated?: (data: unknown) => void;
    onProductDeleted?: (data: unknown) => void;
    onProductReordered?: (data: unknown) => void;
    onPromotionCreated?: (data: unknown) => void;
    onPromotionUpdated?: (data: unknown) => void;
    onPromotionDeleted?: (data: unknown) => void;
  }
) {
  const client = getPusherClient();
  if (!client) return null;

  const channelName = `menu-${menuId}`;
  const channel = client.subscribe(channelName);

  // Bind event handlers
  if (callbacks.onMenuUpdated) {
    channel.bind('menu:updated', callbacks.onMenuUpdated);
  }
  if (callbacks.onCategoryCreated) {
    channel.bind('category:created', callbacks.onCategoryCreated);
  }
  if (callbacks.onCategoryUpdated) {
    channel.bind('category:updated', callbacks.onCategoryUpdated);
  }
  if (callbacks.onCategoryDeleted) {
    channel.bind('category:deleted', callbacks.onCategoryDeleted);
  }
  if (callbacks.onCategoryReordered) {
    channel.bind('category:reordered', callbacks.onCategoryReordered);
  }
  if (callbacks.onProductCreated) {
    channel.bind('product:created', callbacks.onProductCreated);
  }
  if (callbacks.onProductUpdated) {
    channel.bind('product:updated', callbacks.onProductUpdated);
  }
  if (callbacks.onProductDeleted) {
    channel.bind('product:deleted', callbacks.onProductDeleted);
  }
  if (callbacks.onProductReordered) {
    channel.bind('product:reordered', callbacks.onProductReordered);
  }
  if (callbacks.onPromotionCreated) {
    channel.bind('promotion:created', callbacks.onPromotionCreated);
  }
  if (callbacks.onPromotionUpdated) {
    channel.bind('promotion:updated', callbacks.onPromotionUpdated);
  }
  if (callbacks.onPromotionDeleted) {
    channel.bind('promotion:deleted', callbacks.onPromotionDeleted);
  }

  // Return unsubscribe function
  return () => {
    channel.unbind_all();
    client.unsubscribe(channelName);
  };
}

/**
 * Check if Pusher client is available
 */
export function isPusherClientAvailable(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_PUSHER_KEY &&
    process.env.NEXT_PUBLIC_PUSHER_CLUSTER
  );
}

export { pusherClient };
