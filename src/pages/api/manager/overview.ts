import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonSuccess, jsonError } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const auth = await requireRole(req, res, ['manager']);
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
    const orders = await prisma.order.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const revenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const revenueByMonth = orders.reduce<Record<string, number>>(
      (months, order) => {
        const key = order.createdAt.toLocaleString('en-US', { month: 'short' });
        months[key] = (months[key] ?? 0) + Number(order.total);
        return months;
      },
      {}
    );
    const revenueData = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      const month = date.toLocaleString('en-US', { month: 'short' });
      return { month, revenue: Math.round(revenueByMonth[month] ?? 0), target: 10000 };
    });

    // newUsersThisMonth: users created since start of month
    const now = new Date();
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
          totalOrders: orders.length,
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
