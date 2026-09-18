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
    const totalUsers = await prisma.user.count();
    const totalCustomers = await prisma.user.count({
      where: { role: 'CUSTOMER' },
    });
    const totalAdmins = await prisma.user.count({ where: { role: 'ADMIN' } });
    const pendingReviews = await prisma.review.count({
      where: { isHidden: true, hiddenAt: null },
    });
    const lowStockItems = await prisma.product.findMany({
      where: { catalog: 'shop', inventory: { lte: 15 } },
      orderBy: { inventory: 'asc' },
      select: { id: true, name: true, brand: true, inventory: true },
    });
    const now = new Date();
    const currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previousStart = new Date(currentStart.getTime() - 30 * 24 * 60 * 60 * 1000);
    const allOrdersInRange = await prisma.order.findMany({
      where: { createdAt: { gte: previousStart } },
      select: { id: true, total: true, createdAt: true, status: true, user: { select: { username: true } }, items: { select: { quantity: true, unitPrice: true, product: { select: { brand: true } } } } },
      orderBy: { createdAt: 'asc' },
    });
    const ordersCount = await prisma.order.count();
    if (ordersCount === 0) {
      console.info('[manager/overview] no orders in DB for KPI query');
    }
    const currentOrders = allOrdersInRange.filter((order) => order.createdAt >= currentStart && order.status !== 'CANCELLED');
    const previousOrders = allOrdersInRange.filter((order) => order.createdAt >= previousStart && order.createdAt < currentStart && order.status !== 'CANCELLED');
    const revenue = currentOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const previousRevenue = previousOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const percentChange = (current: number, previous: number) => previous === 0 ? null : Math.round(((current - previous) / previous) * 1000) / 10;
    const brandTotals = currentOrders.reduce<Record<string, number>>((totals, order) => {
      order.items.forEach(({ quantity, unitPrice, product }) => { totals[product.brand] = (totals[product.brand] ?? 0) + Number(unitPrice) * quantity; });
      return totals;
    }, {});
    const revenueData = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(currentStart.getTime() + index * 24 * 60 * 60 * 1000);
      const day = date.toISOString().slice(0, 10);
      const amount = currentOrders.filter((order) => order.createdAt.toISOString().slice(0, 10) === day).reduce((sum, order) => sum + Number(order.total), 0);
      return { month: date.toLocaleString('en-US', { month: 'short', day: 'numeric' }), revenue: Math.round(amount), target: 0 };
    });

    // newUsersThisMonth: users created since start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newUsersThisMonth = await prisma.user.count({
      where: { createdAt: { gte: startOfMonth } },
    });

    return jsonSuccess(
      res,
      {
        overview: {
          totalUsers,
          totalCustomers,
          totalAdmins,
          newUsersThisMonth,
          totalRevenue: Math.round(revenue),
          totalOrders: currentOrders.length,
          revenueChange: percentChange(revenue, previousRevenue),
          ordersChange: percentChange(currentOrders.length, previousOrders.length),
          brandShare: Object.entries(brandTotals).map(([name, value]) => ({ name, value: revenue ? Math.round((value / revenue) * 1000) / 10 : 0 })),
          recentOrders: currentOrders.slice(-10).reverse(),
          pendingReviews,
          inventoryAlerts: lowStockItems.length,
          lowStockItems,
          revenueData,
        },
      },
      200
    );
  } catch (error) {
    void error;
    return jsonError(
      res,
      'server_error',
      'Unable to fetch manager overview',
      500
    );
  }
}
