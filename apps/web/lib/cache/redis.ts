import { Redis } from '@upstash/redis';

// Create Redis client (lazy initialization)
let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('Redis not configured. Caching disabled.');
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  PUBLIC_MENU: 5 * 60, // 5 minutes
  USER_SESSION: 30 * 60, // 30 minutes
  ANALYTICS: 60 * 60, // 1 hour
} as const;

// Cache key prefixes
export const CACHE_KEYS = {
  publicMenu: (slug: string) => `menu:public:${slug}`,
  menuCategories: (menuId: string) => `menu:categories:${menuId}`,
  menuProducts: (menuId: string) => `menu:products:${menuId}`,
  userMenus: (userId: string) => `user:menus:${userId}`,
  analytics: (menuId: string, date: string) => `analytics:${menuId}:${date}`,
} as const;

/**
 * Get a value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const value = await client.get<T>(key);
    return value;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set a value in cache with TTL
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = CACHE_TTL.PUBLIC_MENU
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.set(key, value, { ex: ttlSeconds });
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
}

/**
 * Delete a value from cache
 */
export async function cacheDelete(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function cacheDeletePattern(pattern: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
    return true;
  } catch (error) {
    console.error('Cache delete pattern error:', error);
    return false;
  }
}

/**
 * Invalidate all cache for a specific menu
 */
export async function invalidateMenuCache(menuId: string, slug?: string): Promise<void> {
  const promises: Promise<boolean>[] = [
    cacheDelete(CACHE_KEYS.menuCategories(menuId)),
    cacheDelete(CACHE_KEYS.menuProducts(menuId)),
  ];

  if (slug) {
    promises.push(cacheDelete(CACHE_KEYS.publicMenu(slug)));
  }

  await Promise.all(promises);
}

/**
 * Get or set cache (cache-aside pattern)
 */
export async function cacheGetOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = CACHE_TTL.PUBLIC_MENU
): Promise<T> {
  // Try to get from cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Store in cache (don't await, fire and forget)
  cacheSet(key, data, ttlSeconds);

  return data;
}

export { getRedisClient };
