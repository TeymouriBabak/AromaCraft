import type { NextApiRequest, NextApiResponse } from 'next';
import { sendNotFound } from '@/lib/api-response';

/**
 * Middleware: Restrict handler to development mode only
 *
 * Security Purpose: Isolate all /api/dev/* and testing routes
 * These must return 404/403 unless NODE_ENV=development
 *
 * OCL: Dev-mode gating enforcement
 */
export function devOnly(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // In production or non-development environments, always reject
    if (process.env.NODE_ENV !== 'development') {
      return sendNotFound(
        res,
        'This endpoint is not available in this environment.'
      );
    }

    // Additional safety: Reject if USE_MOCKS is explicitly disabled
    if (process.env.USE_MOCKS === 'false') {
      return sendNotFound(res, 'Development endpoints are disabled.');
    }

    try {
      return await handler(req, res);
    } catch (error) {
      // Log but don't expose internal error details
      console.error(
        '[devGuard] Unexpected error in development endpoint:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return sendNotFound(res, 'Development endpoint error.');
    }
  };
}
