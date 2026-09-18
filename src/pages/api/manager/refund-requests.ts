import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess, validateMethod } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

const actionSchema = z.object({ requestId: z.string().min(1), action: z.enum(['approve', 'reject']) });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;

  try {
    if (req.method === 'GET') {
      const requestedStatus = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : undefined;
      const where = requestedStatus && ['REQUESTED', 'APPROVED', 'REJECTED'].includes(requestedStatus)
        ? { status: requestedStatus as 'REQUESTED' | 'APPROVED' | 'REJECTED' }
        : {};
      const requests = await prisma.refundRequest.findMany({
        where,
        orderBy: { requestedAt: 'desc' },
        include: {
          order: { select: { id: true } },
          user: { select: { id: true, name: true, firstName: true, lastName: true, username: true, email: true } },
        },
      });
      return jsonSuccess(res, {
        items: requests.map((request) => ({
          id: request.id,
          requestId: request.id,
          orderId: request.order.id,
          customerName: request.user?.name ?? ([request.user?.firstName, request.user?.lastName].filter(Boolean).join(' ') || request.user?.username || request.user?.email || 'Unknown customer'),
          customerEmail: request.user?.email ?? null,
          reason: request.reason,
          amount: Number(request.amount),
          status: request.status,
          requestedAt: request.requestedAt,
        })),
      }, 200);
    }

    if (req.method === 'PATCH') {
      const parsed = actionSchema.safeParse(req.body);
      if (!parsed.success) return jsonError(res, 'invalid_request', 'Request id and refund action are required.', 400, parsed.error.flatten());
      const existing = await prisma.refundRequest.findUnique({ where: { id: parsed.data.requestId } });
      if (!existing) return jsonError(res, 'not_found', 'Refund request not found.', 404);
      if (existing.status !== 'REQUESTED') return jsonError(res, 'invalid_state', 'Only requested refunds can be changed.', 409);
      const updated = await prisma.refundRequest.update({ where: { id: existing.id }, data: { status: parsed.data.action === 'approve' ? 'APPROVED' : 'REJECTED', decisionAt: new Date(), decidedBy: auth.user.id } });
      return jsonSuccess(res, { refund: updated, action: parsed.data.action }, 200);
    }

    return validateMethod(req, res, ['GET', 'PATCH']);
  } catch (error) {
    console.error('[manager/refund-requests] failed', error);
    return jsonError(res, 'server_error', 'Unable to load refund requests.', 500);
  }
}
