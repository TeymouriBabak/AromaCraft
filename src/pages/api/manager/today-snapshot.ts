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
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // Get today's orders
    const todayOrders = await prisma.order.findMany({
      where: {
        status: { not: 'CANCELLED' },
        createdAt: { gte: todayStart, lt: todayEnd },
      },
      select: {
        id: true,
        total: true,
        status: true,
        createdAt: true,
        user: { select: { username: true, firstName: true, lastName: true } },
        items: {
          select: {
            quantity: true,
            unitPrice: true,
            product: { select: { brand: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get today's revenue
    const todayRevenue = todayOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0
    );

    // Get today's customer counts
    const newCustomersToday = await prisma.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: { gte: todayStart, lt: todayEnd },
      },
    });

    // Get today's reviews
    const newReviewsToday = await prisma.review.count({
      where: {
        createdAt: { gte: todayStart, lt: todayEnd },
      },
    });

    // Get pending reviews
    const pendingReviews = await prisma.review.count({
      where: { isHidden: true, hiddenAt: null },
    });

    // Get low stock items
    const lowStockItems = await prisma.product.findMany({
      where: { catalog: 'shop', inventory: { lte: 15 } },
      orderBy: { inventory: 'asc' },
      select: { id: true, name: true, brand: true, inventory: true },
    });

    return jsonSuccess(
      res,
      {
        snapshot: {
          date: todayStart.toISOString().split('T')[0],
          totalRevenue: Math.round(todayRevenue),
          totalOrders: todayOrders.length,
          newCustomers: newCustomersToday,
          newReviews: newReviewsToday,
          pendingReviews,
          inventoryAlerts: lowStockItems.length,
          recentOrders: todayOrders,
          lowStockItems,
        },
      },
      200
    );
  } catch (error) {
    void error;
    return jsonError(
      res,
      'server_error',
      'Unable to fetch today snapshot',
      500
    );
  }
}
