/**
 * Redis Rate Limiting
 * 
 * Integrates Redis for rate-limiting sensitive endpoints (Login, Signup, OTP Resend, Password Reset)
 * Implements limits per IP and per Identity (Mobile/Email)
 * 
 * OCL Rule 3: Distributed Rate Limiting
 */

import { createClient as nodeCreateClient, type RedisClientType } from 'redis';

// Exported so tests can replace the factory without complex module-mocking.
export let createRedisClient = nodeCreateClient;

let redisClient: RedisClientType | null = null;
let initPromise: Promise<RedisClientType | null> | null = null;
let redisErrorHandler: ((err: unknown) => void) | null = null;
let redisLoggedUnavailable = false; // ensure we log unavailability once in dev

/**
 * Initialize Redis client
 */
export async function initRedis(): Promise<RedisClientType | null> {
  // Reuse existing healthy client
  if (redisClient) {
    const c = redisClient as RedisClientType & { isOpen?: boolean; isReady?: boolean };
    if (c.isOpen || c.isReady) return redisClient;
  }

  // If an initialization is already in progress, await it
  if (initPromise) return initPromise;

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  // Start initialization and save the promise so concurrent callers join it
  initPromise = (async () => {
    let candidate: RedisClientType | null = null;
    try {
      // Create client with a short connect timeout so unavailable Redis doesn't hang requests.
      const opts: Parameters<typeof nodeCreateClient>[0] = { url: redisUrl } as Parameters<typeof nodeCreateClient>[0];
      // Prefer socket-level connect timeout if supported by the redis client
      // Narrowing the opts type to allow adding socket.connectTimeout safely
      // Use unknown to avoid `any` while still allowing runtime augmentation
      const augmentedOpts = opts as unknown as Record<string, unknown>;
      augmentedOpts.socket = {
        ...((augmentedOpts.socket as Record<string, unknown>) || {}),
        connectTimeout: 2000,
        reconnectStrategy: false,
      };
      augmentedOpts.disableOfflineQueue = true;
      candidate = createRedisClient(augmentedOpts as Parameters<typeof nodeCreateClient>[0]) as unknown as RedisClientType;
      if (!candidate) {
        if (process.env.NODE_ENV !== 'production') {
          if (!redisLoggedUnavailable) {
            console.warn('[redis] createClient returned null; continuing without Redis in dev.');
            redisLoggedUnavailable = true;
          }
        }
        return null;
      }

      // Attach a persistent error handler to avoid unhandled rejections and log errors.
      const onError = (err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        if (process.env.NODE_ENV !== 'production') {
          if (!redisLoggedUnavailable) {
            console.warn('[redis] unavailable, rate limiting disabled in dev —', message);
            redisLoggedUnavailable = true;
          }
        } else {
          console.error('[redis] Client error:', message);
        }
      };
      candidate.on('error', onError);

      // Attempt to connect but fail fast (timeout). Avoid long internal reconnect backoffs.
      const connectPromise = candidate.connect();
      const timeoutMs = 2000;
      const timed = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs).unref());
      const res = await Promise.race([connectPromise.then(() => true).catch(() => null), timed]);
      if (!res) {
        // Connection did not succeed quickly — clean up and return null so callers can fall back.
        try {
          const maybe = candidate as unknown as {
            disconnect?: () => Promise<void> | void;
        };
        if (maybe.disconnect) {
           // force-close the socket immediately; quit() would wait for pending
           // replies and can hang when the connection is already broken
           await Promise.resolve(maybe.disconnect()).catch(() => {});
        } else if (candidate.quit) {
           await candidate.quit().catch(() => {});
        }
        } catch {
           // ignore — we only care that the socket is released
        }

        if (process.env.NODE_ENV !== 'production') {
          if (!redisLoggedUnavailable) {
            console.warn('[redis] Connection timeout; continuing without Redis in dev.');
            redisLoggedUnavailable = true;
          }
        } else {
          console.error('[redis] Connection timeout');
        }
        return null;
      }

      // Successful and timely connect
      redisClient = candidate;
      redisErrorHandler = onError;
      console.log('[redis] Connected');
      return redisClient;

    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        if (!redisLoggedUnavailable) {
          console.warn('[redis] Connection failed; continuing without Redis in dev.');
          redisLoggedUnavailable = true;
        }
      } else {
        console.error('[redis] Connection failed:', err instanceof Error ? err.message : 'Unknown error');
      }
      if (candidate) {
        try {
          await (candidate.quit ? candidate.quit() : Promise.resolve());
        } catch {
          try {
            const maybe = candidate as unknown as { disconnect?: () => void };
            maybe.disconnect?.();
          } catch {
            // ignore
          }
        }
      }
      // In tests, provide an in-memory fallback so rate-limiting behavior is deterministic
      if (process.env.NODE_ENV === 'test') {
        if (!redisLoggedUnavailable) {
          console.warn('[redis] Using in-memory test fallback for rate limiting');
          redisLoggedUnavailable = true;
        }
        // Simple in-memory store implementing minimal methods used by this module
        const store = new Map<string, { val: number; expiresAt?: number }>();
        const inMemoryClient = {
          incr: async (key: string) => {
            const entry = store.get(key) ?? { val: 0 };
            entry.val = (entry.val ?? 0) + 1;
            store.set(key, entry);
            return entry.val;
          },
          expire: async (key: string, secs: number) => {
            const entry = store.get(key) ?? { val: 0 };
            entry.expiresAt = Date.now() + secs * 1000;
            store.set(key, entry);
            return 1;
          },
          get: async (key: string) => {
            const entry = store.get(key);
            if (!entry) return null;
            if (entry.expiresAt && Date.now() > entry.expiresAt) {
              store.delete(key);
              return null;
            }
            return String(entry.val);
          },
          del: async (key: string) => {
            store.delete(key);
            return 1;
          },
          quit: async () => { store.clear(); return; },
        } as unknown as RedisClientType;
        redisClient = inMemoryClient;
        // Mark the in-memory test fallback as ready so `getRedis()` treats it usable.
        try {
          (redisClient as unknown as { isReady?: boolean }).isReady = true;
        } catch {
          // ignore
        }
        return redisClient;
      }
      return null;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Get Redis client instance
 */
export function getRedis(): RedisClientType | null {
  if (!redisClient) return null;
  // Treat non-open clients as unusable
  const c = redisClient as RedisClientType & { isOpen?: boolean; isReady?: boolean };
  if (c.isOpen || c.isReady) return redisClient;
  return null;
}

/**
 * Rate limit by key (generic)
 * @param key - Rate limit key (e.g., "login:user@example.com" or "signup:127.0.0.1")
 * @param limit - Max allowed requests
 * @param windowSeconds - Time window in seconds
 * @returns true if request is allowed, false if rate limit exceeded
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  let redis = getRedis();
  if (!redis) {
    // Attempt lazy initialization. If it fails, preserve fail-closed semantics.
    redis = await initRedis();
  }
  if (!redis) {
    console.error('[rate-limit] Redis unavailable; denying request to preserve fail-closed security.');
    return false;
  }

  try {
    const current = await redis.incr(key);
    if (current === 1) {
      // First request, set expiry
      await redis.expire(key, windowSeconds);
    }
    return current <= limit;
  } catch (err) {
    console.error('[rate-limit] Check failed:', err instanceof Error ? err.message : 'Unknown error');
    // If Redis errors due to connection or abort:
    // - In `test` and `production`, fail-closed (deny)
    // - In other non-production environments (development), fail-open (allow)
    if (process.env.NODE_ENV === 'test') return false;
    if (process.env.NODE_ENV !== 'production') return true;
    return false;
  }
}

/**
 * Get remaining rate limit attempts
 */
export async function getRateLimitRemaining(
  key: string,
  limit: number
): Promise<number> {
  const redis = getRedis();
  if (!redis) return limit;

  try {
    const current = await redis.get(key);
    const count = parseInt(current || '0', 10);
    return Math.max(0, limit - count);
  } catch {
    return limit;
  }
}

/**
 * Reset rate limit for a key
 */
export async function resetRateLimit(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (err) {
    console.error('[rate-limit] Reset failed:', err instanceof Error ? err.message : 'Unknown error');
  }
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClient = null;
      // allow re-initialization after close
      initPromise = null;
      // remove attached error handler if present
      try {
        if (redisErrorHandler && redisClient) {
          const c = redisClient as { off?: (event: string, fn: (err: unknown) => void) => void };
          c.off?.('error', redisErrorHandler);
        }
      } catch {
        // ignore failures while cleaning up
      }
      redisErrorHandler = null;
      console.log('[redis] Disconnected');
    } catch (err) {
      console.error('[redis] Disconnect error:', err instanceof Error ? err.message : 'Unknown error');
    }
  }
}

/**
 * Rate limit config for different endpoints
 */

function parseEnvLimit(varName: string, defaultLimit: number, defaultWindow: number) {
  const raw = process.env[varName];
  if (!raw) return { limit: defaultLimit, windowSeconds: defaultWindow };
  const parts = String(raw).split(':');
  if (parts.length !== 2) return { limit: defaultLimit, windowSeconds: defaultWindow };
  const lim = Number(parts[0]);
  const win = Number(parts[1]);
  if (!Number.isFinite(lim) || !Number.isFinite(win) || lim <= 0 || win <= 0) return { limit: defaultLimit, windowSeconds: defaultWindow };
  return { limit: Math.floor(lim), windowSeconds: Math.floor(win) };
}

// Allow environment to override rate limits using `RATE_LIMIT_*` vars in the form `limit:windowSeconds`.
export const RATE_LIMIT_CONFIG = {
  LOGIN: parseEnvLimit('RATE_LIMIT_LOGIN', 5, 15 * 60),
  SIGNUP: parseEnvLimit('RATE_LIMIT_SIGNUP', 3, 60 * 60),
  OTP_VERIFY: parseEnvLimit('RATE_LIMIT_OTP_VERIFY', 5, 15 * 60),
  OTP_RESEND: parseEnvLimit('RATE_LIMIT_OTP_RESEND', 3, 60 * 60),
  PASSWORD_RESET: parseEnvLimit('RATE_LIMIT_PASSWORD_RESET', 3, 60 * 60),
};

// In test environment, force canonical defaults for deterministic behavior
if (process.env.NODE_ENV === 'test') {
  Object.assign(RATE_LIMIT_CONFIG, {
    LOGIN: { limit: 5, windowSeconds: 15 * 60 },
    SIGNUP: { limit: 3, windowSeconds: 60 * 60 },
    OTP_VERIFY: { limit: 5, windowSeconds: 15 * 60 },
    OTP_RESEND: { limit: 3, windowSeconds: 60 * 60 },
    PASSWORD_RESET: { limit: 3, windowSeconds: 60 * 60 },
  });
}

// Test helper to replace the client factory in tests without mutating the ESM namespace.
export function setCreateRedisClient(fn: unknown) {
  createRedisClient = fn as typeof nodeCreateClient;
}

// Test helper to reset internal state (for test isolation). Only used by tests.
export function resetRedisTestState() {
  initPromise = null;
  redisClient = null;
  redisErrorHandler = null;
  redisLoggedUnavailable = false;
  createRedisClient = nodeCreateClient;
}
