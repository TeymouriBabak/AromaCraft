import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess, validateMethod } from '@/lib/api-utils';

const couponSchema = z.object({
  code: z.string().trim().min(2),
  discount: z.coerce.number().min(0).max(100),
  active: z.boolean().optional().default(true),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;

  if (req.method === 'GET') {
    return jsonSuccess(
      res,
      {
        items: [
          { id: 'coupon-1', code: 'WELCOME10', discount: 10, active: true },
          { id: 'coupon-2', code: 'ROAST20', discount: 20, active: true },
          { id: 'coupon-3', code: 'FALL15', discount: 15, active: false },
        ],
      },
      200
    );
  }

  if (req.method === 'POST') {
    const payload = couponSchema.safeParse(req.body);
    if (!payload.success) {
      return jsonError(res, 'invalid_request', 'Invalid coupon payload.', 400, payload.error.flatten());
    }

    return jsonSuccess(
      res,
      {
        item: {
          id: `coupon-${Date.now()}`,
          code: payload.data.code.toUpperCase(),
          discount: payload.data.discount,
          active: payload.data.active,
        },
      },
      201
    );
  }

  return validateMethod(req, res, ['GET', 'POST']);
}
