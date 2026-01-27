import Pusher from 'pusher';

// Create Pusher server instance (lazy initialization)
let pusherServer: Pusher | null = null;

function getPusherServer(): Pusher | null {
  if (pusherServer) return pusherServer;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    console.warn('Pusher not configured. Real-time updates disabled.');
    return null;
  }

  pusherServer = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });

  return pusherServer;
}

// Channel naming conventions
export const CHANNELS = {
  menu: (menuId: string) => `menu-${menuId}`,
  user: (userId: string) => `private-user-${userId}`,
} as const;

// Event types
export const EVENTS = {
  // Menu events
  MENU_UPDATED: 'menu:updated',
  MENU_PUBLISHED: 'menu:published',
  MENU_UNPUBLISHED: 'menu:unpublished',
  MENU_DELETED: 'menu:deleted',

  // Category events
  CATEGORY_CREATED: 'category:created',
  CATEGORY_UPDATED: 'category:updated',
  CATEGORY_DELETED: 'category:deleted',
  CATEGORY_REORDERED: 'category:reordered',

  // Product events
  PRODUCT_CREATED: 'product:created',
  PRODUCT_UPDATED: 'product:updated',
  PRODUCT_DELETED: 'product:deleted',
  PRODUCT_REORDERED: 'product:reordered',

  // Promotion events
  PROMOTION_CREATED: 'promotion:created',
  PROMOTION_UPDATED: 'promotion:updated',
  PROMOTION_DELETED: 'promotion:deleted',
} as const;

export type EventType = (typeof EVENTS)[keyof typeof EVENTS];

/**
 * Check if Pusher is configured
 */
export function isPusherConfigured(): boolean {
  return !!(
    process.env.PUSHER_APP_ID &&
    process.env.PUSHER_KEY &&
    process.env.PUSHER_SECRET &&
    process.env.PUSHER_CLUSTER
  );
}

/**
 * Trigger an event on a channel
 */
export async function triggerEvent<T>(
  channel: string,
  event: EventType,
  data: T
): Promise<boolean> {
  const pusher = getPusherServer();
  if (!pusher) return false;

  try {
    await pusher.trigger(channel, event, data);
    return true;
  } catch (error) {
    console.error('Pusher trigger error:', error);
    return false;
  }
}

/**
 * Trigger a menu-related event
 */
export async function triggerMenuEvent<T>(
  menuId: string,
  event: EventType,
  data: T
): Promise<boolean> {
  return triggerEvent(CHANNELS.menu(menuId), event, data);
}

/**
 * Trigger multiple events at once (batch)
 */
export async function triggerBatch(
  events: Array<{ channel: string; event: EventType; data: unknown }>
): Promise<boolean> {
  const pusher = getPusherServer();
  if (!pusher) return false;

  try {
    await pusher.triggerBatch(
      events.map((e) => ({
        channel: e.channel,
        name: e.event,
        data: e.data,
      }))
    );
    return true;
  } catch (error) {
    console.error('Pusher batch trigger error:', error);
    return false;
  }
}

export { getPusherServer };
