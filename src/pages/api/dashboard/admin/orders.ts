import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess, validateMethod } from '@/lib/api-utils';
import { can } from '@/lib/auth/permissions';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const methodError = validateMethod(req, res, ['GET']);
  if (methodError) return methodError;

  const auth = await requireRole(req, res, ['admin', 'manager']);
  if (!auth) return;

  if (!can(auth.user.role, 'order:read')) {
    return jsonError(res, 'forbidden', 'Access denied.', 403);
  }

  try {
    const statusFilter = typeof req.query.status === 'string'
      ? req.query.status.toUpperCase()
      : 'ALL';
    const page = Math.max(1, Number(req.query.page ?? '1'));
    const limit = Math.min(Math.max(Number(req.query.limit ?? '20'), 1), 100);

    const where: Record<string, unknown> = {};
    if (statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    const [total, items] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: true,
          refundRequests: true,
        },
      }),
    ]);

    return jsonSuccess(
      res,
      {
        data: items.map((order) => ({
          id: order.id,
          customerId: order.userId,
          customerName:
            order.user?.firstName && order.user?.lastName
              ? `${order.user.firstName} ${order.user.lastName}`
              : order.user?.username || 'Unknown',
          customerEmail: order.user?.email || null,
          status: order.status,
          itemCount: order.items.length,
          total: Number(order.total),
          createdAt: order.createdAt,
          refundRequests: order.refundRequests.length,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      200
    );
  } catch (error) {
    console.error('[admin/orders]', error);
    return jsonError(res, 'internal_error', 'Failed to fetch orders.', 500);
  }
}
