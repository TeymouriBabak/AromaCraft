import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const client = createClient({ url: redisUrl });
client.connect().catch(() => {});

export async function checkRateLimit(key: string, limit = 5, windowSec = 60) {
  const now = Math.floor(Date.now() / 1000);
  const redisKey = `rate:${key}:${Math.floor(now / windowSec)}`;
  const count = await client.incr(redisKey);
  if (count === 1) {
    await client.expire(redisKey, windowSec);
  }
  return { allowed: count <= limit, count };
}
