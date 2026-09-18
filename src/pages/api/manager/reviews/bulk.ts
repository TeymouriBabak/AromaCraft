import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

const schema = z.object({ ids: z.array(z.string().min(1)).min(1).max(100), action: z.enum(['approve', 'reject']), rejectionReason: z.string().trim().max(1000).optional() });
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;
  if (req.method !== 'PATCH') return jsonError(res, 'method_not_allowed', 'Method not allowed.', 405);
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return jsonError(res, 'invalid_request', 'Review ids and action are required.', 400, parsed.error.flatten());
    const data = parsed.data.action === 'approve' ? { status: 'APPROVED' as const, moderatedAt: new Date(), moderatedBy: auth.user.id, rejectionReason: null, isHidden: false, hiddenAt: null, hiddenBy: null } : { status: 'REJECTED' as const, moderatedAt: new Date(), moderatedBy: auth.user.id, rejectionReason: parsed.data.rejectionReason || null, isHidden: true, hiddenAt: new Date(), hiddenBy: auth.user.id };
    const result = await prisma.review.updateMany({ where: { id: { in: parsed.data.ids } }, data });
    return jsonSuccess(res, { updated: result.count, action: parsed.data.action }, 200);
  } catch (error) {
    console.error('[manager/reviews/bulk] failed', error);
    return jsonError(res, 'server_error', 'Unable to apply bulk moderation action.', 500);
  }
}
