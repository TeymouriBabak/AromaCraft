import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;
  if (req.method !== 'GET') return jsonError(res, 'method_not_allowed', 'Method not allowed', 405);
  try {
    const orders = await prisma.order.findMany({ where: { status: { not: 'CANCELLED' } }, select: { items: { select: { quantity: true, unitPrice: true, product: { select: { brand: true } } } } } });
    const totals = orders.flatMap((order) => order.items).reduce<Record<string, { unitsSold: number; revenue: number }>>((result, item) => {
      const brand = item.product.brand || 'Unbranded';
      const current = result[brand] ?? { unitsSold: 0, revenue: 0 };
      result[brand] = { unitsSold: current.unitsSold + item.quantity, revenue: current.revenue + Number(item.unitPrice) * item.quantity };
      return result;
    }, {});
    const totalRevenue = Object.values(totals).reduce((sum, item) => sum + item.revenue, 0);
    const brands = Object.entries(totals).map(([name, item]) => ({ name, unitsSold: item.unitsSold, revenue: Math.round(item.revenue * 100) / 100, percentage: totalRevenue ? Math.round((item.revenue / totalRevenue) * 10000) / 100 : 0 })).sort((a, b) => b.revenue - a.revenue);
    return jsonSuccess(res, { brands, totalRevenue: Math.round(totalRevenue * 100) / 100, totalUnits: brands.reduce((sum, brand) => sum + brand.unitsSold, 0) }, 200);
  } catch (error) {
    console.error('[manager/reports/sales-by-brand] failed', error);
    return jsonError(res, 'server_error', 'Unable to fetch brand sales report', 500);
  }
}