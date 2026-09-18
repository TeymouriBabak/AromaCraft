import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess, validateMethod } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;

  if (req.method !== 'GET') {
    return validateMethod(req, res, ['GET']);
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: thirtyDaysAgo }, status: { not: 'CANCELLED' } },
      select: { id: true, total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const revenueData = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(Date.now() - (29 - index) * 24 * 60 * 60 * 1000);
      const dayKey = date.toISOString().slice(0, 10);
      const revenue = orders
        .filter((order) => order.createdAt.toISOString().slice(0, 10) === dayKey)
        .reduce((sum, order) => sum + Number(order.total), 0);

      return {
        day: dayKey,
        revenue,
        orders: orders.filter((order) => order.createdAt.toISOString().slice(0, 10) === dayKey).length,
      };
    });

    const summary = {
      totalRevenue: orders.reduce((sum, order) => sum + Number(order.total), 0),
      totalOrders: orders.length,
      averageOrderValue: orders.length ? orders.reduce((sum, order) => sum + Number(order.total), 0) / orders.length : 0,
      revenueData,
      topDay: revenueData.reduce((max, day) => (day.revenue > max.revenue ? day : max), revenueData[0] ?? { day: '', revenue: 0, orders: 0 }),
    };

    return jsonSuccess(res, { summary }, 200);
  } catch (error) {
    console.error('[manager/analytics] failed', error);
    return jsonError(res, 'server_error', 'Unable to load analytics data.', 500);
  }
}
