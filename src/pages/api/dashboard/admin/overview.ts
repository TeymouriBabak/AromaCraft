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

  if (!can(auth.user.role, 'dashboard:overview')) {
    return jsonError(
      res,
      'forbidden',
      'You do not have permission to access this dashboard.',
      403
    );
  }

  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todayOrdersCount,
      todayRevenue,
      pendingOrdersCount,
      refundRequestsCount,
      lowStockCount,
      totalOrders,
      totalRevenue,
    ] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: today, lt: tomorrow },
        },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: { status: 'PENDING' },
      }),
      prisma.refundRequest.count({
        where: { status: 'REQUESTED' },
      }),
      prisma.product.count({
        where: {
          inventory: { lte: 5 },
        },
      }),
      prisma.order.count({}),
      prisma.order.aggregate({
        _sum: { total: true },
      }),
    ]);

    return jsonSuccess(
      res,
      {
        overview: {
          todayOrders: todayOrdersCount,
          todayRevenue: todayRevenue._sum.total
            ? Number(todayRevenue._sum.total)
            : 0,
          pendingOrders: pendingOrdersCount,
          openRefunds: refundRequestsCount,
          lowStockCount: lowStockCount,
          totalOrders: totalOrders,
          totalRevenue: totalRevenue._sum.total
            ? Number(totalRevenue._sum.total)
            : 0,
        },
      },
      200
    );
  } catch (error) {
    console.error('[admin/overview]', error);
    return jsonError(
      res,
      'internal_error',
      'Failed to fetch admin overview.',
      500
    );
  }
}
