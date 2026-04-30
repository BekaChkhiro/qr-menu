import { getRedisClient } from '@/lib/cache/redis';

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // epoch ms when the window expires
}

export interface RateLimiter {
  /** Increments the counter and reports whether the caller is within the limit. */
  consume(key: string): Promise<RateLimitResult>;
  /** Reports the current status without incrementing. */
  peek(key: string): Promise<RateLimitResult>;
  /** Drops all state for the given key. */
  reset(key: string): Promise<void>;
}

interface LimiterConfig {
  prefix: string;
  limit: number;
  windowSeconds: number;
}

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

function nowMs(): number {
  return Date.now();
}

function memoryConsume(fullKey: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = nowMs();
  const existing = memoryStore.get(fullKey);

  if (!existing || existing.resetAt <= now) {
    const fresh: MemoryEntry = { count: 1, resetAt: now + windowSeconds * 1000 };
    memoryStore.set(fullKey, fresh);
    return { success: true, remaining: Math.max(0, limit - 1), reset: fresh.resetAt };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  return { success: existing.count <= limit, remaining, reset: existing.resetAt };
}

function memoryPeek(fullKey: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = nowMs();
  const existing = memoryStore.get(fullKey);
  if (!existing || existing.resetAt <= now) {
    return { success: true, remaining: limit, reset: now + windowSeconds * 1000 };
  }
  const remaining = Math.max(0, limit - existing.count);
  // peek reports whether a subsequent consume would still fit within the budget.
  return { success: existing.count < limit, remaining, reset: existing.resetAt };
}

function createLimiter(config: LimiterConfig): RateLimiter {
  const fullKey = (key: string) => `${config.prefix}:${key}`;

  return {
    async consume(key: string): Promise<RateLimitResult> {
      const redis = getRedisClient();
      const fk = fullKey(key);

      if (!redis) {
        return memoryConsume(fk, config.limit, config.windowSeconds);
      }

      try {
        const count = await redis.incr(fk);
        if (count === 1) {
          // First hit in the window — set TTL.
          await redis.expire(fk, config.windowSeconds);
        }
        const ttl = await redis.ttl(fk);
        const reset = nowMs() + Math.max(ttl, 0) * 1000;
        const remaining = Math.max(0, config.limit - count);
        return { success: count <= config.limit, remaining, reset };
      } catch (err) {
        console.error('Rate limiter Redis error, falling back to memory:', err);
        return memoryConsume(fk, config.limit, config.windowSeconds);
      }
    },

    async peek(key: string): Promise<RateLimitResult> {
      const redis = getRedisClient();
      const fk = fullKey(key);

      if (!redis) {
        return memoryPeek(fk, config.limit, config.windowSeconds);
      }

      try {
        const raw = await redis.get<number>(fk);
        const count = typeof raw === 'number' ? raw : raw == null ? 0 : Number(raw);
        const ttl = await redis.ttl(fk);
        const reset = nowMs() + Math.max(ttl, 0) * 1000;
        const remaining = Math.max(0, config.limit - count);
        return { success: count < config.limit, remaining, reset };
      } catch (err) {
        console.error('Rate limiter Redis peek error, falling back to memory:', err);
        return memoryPeek(fk, config.limit, config.windowSeconds);
      }
    },

    async reset(key: string): Promise<void> {
      const redis = getRedisClient();
      const fk = fullKey(key);

      memoryStore.delete(fk);

      if (!redis) return;
      try {
        await redis.del(fk);
      } catch (err) {
        console.error('Rate limiter Redis reset error:', err);
      }
    },
  };
}

// Limits any IP to 10 join attempts per 10 minutes — covers brute-force probing
// of table codes regardless of which table they target.
export const tableJoinLimiter = createLimiter({
  prefix: 'rl:table:join',
  limit: 10,
  windowSeconds: 10 * 60,
});

// Counts only WRONG PIN attempts per (tableId, ip). 5 strikes within 15 minutes
// locks the pair out of further attempts on that table — even with the right
// PIN — for the remainder of the window.
export const tablePinLimiter = createLimiter({
  prefix: 'rl:table:pin',
  limit: 5,
  windowSeconds: 15 * 60,
});

/** Helper: extract the client IP from the request. Falls back to "unknown". */
export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

/** Test-only — flush the in-memory store between tests. */
export function __resetRateLimiterMemory(): void {
  memoryStore.clear();
}
