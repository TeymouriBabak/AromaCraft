/**
 * Redis Rate Limiting
 * 
 * Integrates Redis for rate-limiting sensitive endpoints (Login, Signup, OTP Resend, Password Reset)
 * Implements limits per IP and per Identity (Mobile/Email)
 * 
 * OCL Rule 3: Distributed Rate Limiting
 */

import { createClient, type RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

/**
 * Initialize Redis client
 */
export async function initRedis(): Promise<RedisClientType | null> {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (err) => {
      console.error('[redis] Client error:', err.message);
    });
    await redisClient.connect();
    console.log('[redis] Connected');
    return redisClient;
  } catch (err) {
    console.error('[redis] Connection failed:', err instanceof Error ? err.message : 'Unknown error');
    return null;
  }
}

/**
 * Get Redis client instance
 */
export function getRedis(): RedisClientType | null {
  return redisClient;
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
  const redis = getRedis();
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
      console.log('[redis] Disconnected');
    } catch (err) {
      console.error('[redis] Disconnect error:', err instanceof Error ? err.message : 'Unknown error');
    }
  }
}

/**
 * Rate limit config for different endpoints
 */
export const RATE_LIMIT_CONFIG = {
  LOGIN: { limit: 5, windowSeconds: 15 * 60 }, // 5 attempts per 15 minutes
  SIGNUP: { limit: 3, windowSeconds: 60 * 60 }, // 3 attempts per hour
  OTP_VERIFY: { limit: 5, windowSeconds: 15 * 60 }, // 5 attempts per 15 minutes
  OTP_RESEND: { limit: 3, windowSeconds: 60 * 60 }, // 3 attempts per hour
  PASSWORD_RESET: { limit: 3, windowSeconds: 60 * 60 }, // 3 attempts per hour
};
