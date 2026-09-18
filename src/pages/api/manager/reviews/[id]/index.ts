import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;
  if (req.method !== 'DELETE') return jsonError(res, 'method_not_allowed', 'Method not allowed.', 405);
  try {
    const id = typeof req.query.id === 'string' ? req.query.id : '';
    const existing = await prisma.review.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return jsonError(res, 'not_found', 'Review not found.', 404);
    await prisma.review.delete({ where: { id } });
    return jsonSuccess(res, { deleted: true, id }, 200);
  } catch (error) {
    console.error('[manager/reviews/delete] failed', error);
    return jsonError(res, 'server_error', 'Unable to delete review.', 500);
  }
}
