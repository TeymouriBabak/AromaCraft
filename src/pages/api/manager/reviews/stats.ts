import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;
  if (req.method !== 'GET') return jsonError(res, 'method_not_allowed', 'Method not allowed.', 405);
  try {
    const [pending, approved, rejected, total, aggregate] = await Promise.all([
      prisma.review.count({ where: { status: 'PENDING' } }), prisma.review.count({ where: { status: 'APPROVED' } }), prisma.review.count({ where: { status: 'REJECTED' } }), prisma.review.count(), prisma.review.aggregate({ _avg: { rating: true } }),
    ]);
    return jsonSuccess(res, { pending, approved, rejected, total, averageRating: aggregate._avg.rating ?? 0 }, 200);
  } catch (error) {
    console.error('[manager/reviews/stats] failed', error);
    return jsonError(res, 'server_error', 'Unable to load review statistics.', 500);
  }
}
