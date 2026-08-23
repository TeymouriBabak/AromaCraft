import type { NextApiRequest, NextApiResponse } from 'next';
import { checkRateLimit, RATE_LIMIT_CONFIG } from '@/lib/redis';
import { jsonError } from '@/lib/api-utils';

export async function rateLimitMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  keyBase: string,
  configKey: keyof typeof RATE_LIMIT_CONFIG
) {
  const ip =
    req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const key = `ratelimit:${keyBase}:${ip}`;
  const cfg = RATE_LIMIT_CONFIG[configKey];
  const allowed = await checkRateLimit(key, cfg.limit, cfg.windowSeconds);
  if (!allowed)
    return jsonError(res, 'rate_limited', 'Rate limit exceeded', 429, {
      keyBase,
    });
  return null;
}
