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
    const previousStart = new Date(
      currentStart.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    // Fetch orders for the last 60 days
    const orders = await prisma.order.findMany({
      where: {
        status: { not: 'CANCELLED' },
        createdAt: { gte: previousStart },
      },
      select: {
        id: true,
        total: true,
        createdAt: true,
        user: { select: { username: true } },
        items: {
          select: { quantity: true, unitPrice: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const currentOrders = orders.filter(
      (order) => order.createdAt >= currentStart
    );
    const previousOrders = orders.filter(
      (order) =>
        order.createdAt >= previousStart && order.createdAt < currentStart
    );

    // Calculate revenue and change
    const revenue = currentOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0
    );
    const previousRevenue = previousOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0
    );

    const percentChange = (current: number, previous: number) =>
      previous === 0 ? null : Math.round(((current - previous) / previous) * 1000) / 10;

    const revenueChange = percentChange(revenue, previousRevenue);
    const ordersChange = percentChange(
      currentOrders.length,
      previousOrders.length
    );

    // Get customer counts
    const totalCustomers = await prisma.user.count({
      where: { role: 'CUSTOMER' },
    });

    const pendingReviews = await prisma.review.count({
      where: { isHidden: true, hiddenAt: null },
    });

    const lowStockItems = await prisma.product.findMany({
      where: { catalog: 'shop', inventory: { lte: 15 } },
      orderBy: { inventory: 'asc' },
      select: { id: true, name: true, brand: true, inventory: true },
    });

    const kpis = [
      {
        label: 'Revenue',
        value: Math.round(revenue),
        trend: revenueChange,
        icon: 'DollarSign',
        color: '#72b58d',
      },
      {
        label: 'Orders',
        value: currentOrders.length,
        trend: ordersChange,
        icon: 'ClipboardList',
        color: '#5ea8d6',
      },
      {
        label: 'Customers',
        value: totalCustomers,
        trend: null,
        icon: 'Users',
        color: '#bd8bbd',
      },
      {
        label: 'Reviews',
        value: pendingReviews,
        trend: null,
        icon: 'MessageSquare',
        color: '#e0a64d',
      },
      {
        label: 'Low-stock',
        value: lowStockItems.length,
        trend: null,
        icon: 'AlertTriangle',
        color: '#db6b63',
      },
    ];

    return jsonSuccess(
      res,
      {
        kpis,
        lowStockItems,
      },
      200
    );
  } catch (error) {
    void error;
    return jsonError(
      res,
      'server_error',
      'Unable to fetch KPI cards data',
      500
    );
  }
}
