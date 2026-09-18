import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;
  if (req.method !== 'GET') return jsonError(res, 'method_not_allowed', 'Method not allowed', 405);

  try {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: start }, status: { not: 'CANCELLED' } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const months = Array.from({ length: 12 }, (_, index) => new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1)));
    const series = months.map((month) => {
      const nextMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1));
      const revenue = orders.filter((order) => order.createdAt >= month && order.createdAt < nextMonth).reduce((sum, order) => sum + Number(order.total), 0);
      return { month: month.toISOString().slice(0, 7), label: month.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }), revenue: Math.round(revenue * 100) / 100, target: 0 };
    });
    const currentMonth = series[11]?.revenue ?? 0;
    const currentOrders = orders.filter((order) => order.createdAt >= months[11]);
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    return jsonSuccess(res, { series, totalRevenue: Math.round(currentMonth * 100) / 100, averageOrderValue: currentOrders.length ? Math.round((currentMonth / currentOrders.length) * 100) / 100 : 0, revenueVsTarget: null, totalOrders: currentOrders.length, allTimeRevenue: Math.round(totalRevenue * 100) / 100 }, 200);
  } catch (error) {
    console.error('[manager/reports/revenue] failed', error);
    return jsonError(res, 'server_error', 'Unable to fetch revenue report', 500);
  }
}