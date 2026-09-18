import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess, validateMethod } from '@/lib/api-utils';

const settingsSchema = z.object({
  businessName: z.string().trim().min(2).optional(),
  supportEmail: z.string().email().optional(),
  timezone: z.string().trim().optional(),
  autoApproveReviews: z.boolean().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;

  if (req.method === 'GET') {
    return jsonSuccess(
      res,
      {
        settings: {
          businessName: 'AromaCraft',
          supportEmail: 'support@aromacraft.com',
          timezone: 'UTC',
          autoApproveReviews: true,
        },
      },
      200
    );
  }

  if (req.method === 'PATCH') {
    const payload = settingsSchema.safeParse(req.body);
    if (!payload.success) {
      return jsonError(res, 'invalid_request', 'Invalid settings payload.', 400, payload.error.flatten());
    }

    return jsonSuccess(
      res,
      {
        settings: {
          businessName: payload.data.businessName ?? 'AromaCraft',
          supportEmail: payload.data.supportEmail ?? 'support@aromacraft.com',
          timezone: payload.data.timezone ?? 'UTC',
          autoApproveReviews: payload.data.autoApproveReviews ?? true,
        },
      },
      200
    );
  }

  return validateMethod(req, res, ['GET', 'PATCH']);
}
