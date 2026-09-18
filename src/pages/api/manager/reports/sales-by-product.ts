import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;
  if (req.method !== 'GET') return jsonError(res, 'method_not_allowed', 'Method not allowed', 405);
  try {
    const orders = await prisma.order.findMany({ where: { status: { not: 'CANCELLED' } }, select: { items: { select: { quantity: true, unitPrice: true, product: { select: { id: true, name: true, brand: true } } } } } });
    const products = orders.flatMap((order) => order.items).reduce<Record<number, { id: number; name: string; brand: string; unitsSold: number; revenue: number }>>((result, item) => {
      const product = item.product;
      const current = result[product.id] ?? { ...product, unitsSold: 0, revenue: 0 };
      result[product.id] = { ...current, unitsSold: current.unitsSold + item.quantity, revenue: current.revenue + Number(item.unitPrice) * item.quantity };
      return result;
    }, {});
    const items = Object.values(products).map((item) => ({ ...item, revenue: Math.round(item.revenue * 100) / 100 })).sort((a, b) => b.revenue - a.revenue);
    return jsonSuccess(res, { items, totalRevenue: items.reduce((sum, item) => sum + item.revenue, 0), totalUnits: items.reduce((sum, item) => sum + item.unitsSold, 0) }, 200);
  } catch (error) {
    console.error('[manager/reports/sales-by-product] failed', error);
    return jsonError(res, 'server_error', 'Unable to fetch product sales report', 500);
  }
}