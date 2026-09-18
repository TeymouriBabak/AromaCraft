import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

const schema = z.object({ rejectionReason: z.string().trim().max(1000).optional() });
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;
  if (req.method !== 'PATCH') return jsonError(res, 'method_not_allowed', 'Method not allowed.', 405);
  try {
    const id = typeof req.query.id === 'string' ? req.query.id : '';
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return jsonError(res, 'not_found', 'Review not found.', 404);
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) return jsonError(res, 'invalid_request', 'Invalid rejection reason.', 400, parsed.error.flatten());
    const updated = review.status === 'REJECTED' ? review : await prisma.review.update({ where: { id }, data: { status: 'REJECTED', moderatedAt: new Date(), moderatedBy: auth.user.id, rejectionReason: parsed.data.rejectionReason || null, isHidden: true, hiddenAt: new Date(), hiddenBy: auth.user.id } });
    return jsonSuccess(res, { review: updated }, 200);
  } catch (error) {
    console.error('[manager/reviews/reject] failed', error);
    return jsonError(res, 'server_error', 'Unable to reject review.', 500);
  }
}
