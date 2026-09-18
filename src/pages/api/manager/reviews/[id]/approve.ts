import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;
  if (req.method !== 'PATCH') return jsonError(res, 'method_not_allowed', 'Method not allowed.', 405);
  try {
    const id = typeof req.query.id === 'string' ? req.query.id : '';
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return jsonError(res, 'not_found', 'Review not found.', 404);
    const updated = review.status === 'APPROVED' ? review : await prisma.review.update({ where: { id }, data: { status: 'APPROVED', moderatedAt: new Date(), moderatedBy: auth.user.id, rejectionReason: null, isHidden: false, hiddenAt: null, hiddenBy: null } });
    return jsonSuccess(res, { review: updated }, 200);
  } catch (error) {
    console.error('[manager/reviews/approve] failed', error);
    return jsonError(res, 'server_error', 'Unable to approve review.', 500);
  }
}
