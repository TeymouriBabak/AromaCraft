import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonSuccess, jsonError } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;

  if (req.method !== 'GET')
    return jsonError(res, 'method_not_allowed', 'Method not allowed', 405);

  try {
    const now = new Date();
    const currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch orders for the last 30 days
    const orders = await prisma.order.findMany({
      where: {
        status: { not: 'CANCELLED' },
        createdAt: { gte: currentStart },
      },
      select: {
        id: true,
        total: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const revenueData = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(currentStart.getTime() + index * 24 * 60 * 60 * 1000);
      const day = date.toISOString().slice(0, 10);
      const amount = orders
        .filter((order) => order.createdAt.toISOString().slice(0, 10) === day)
        .reduce((sum, order) => sum + Number(order.total), 0);
      return {
        month: date.toLocaleString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Math.round(amount),
        target: 0, // Can be updated with actual targets if available
      };
    });

    return jsonSuccess(
      res,
      {
        revenueData,
        totalRevenue: orders.reduce((sum, order) => sum + Number(order.total), 0),
        averageDailyRevenue: Math.round(
          orders.reduce((sum, order) => sum + Number(order.total), 0) / 30
        ),
      },
      200
    );
  } catch (error) {
    void error;
    return jsonError(
      res,
      'server_error',
      'Unable to fetch revenue vs target data',
      500
    );
  }
}
