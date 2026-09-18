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
        total: true,
        items: {
          select: {
            quantity: true,
            unitPrice: true,
            product: { select: { brand: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate brand totals
    const brandTotals = orders.reduce<Record<string, number>>((totals, order) => {
      order.items.forEach(({ quantity, unitPrice, product }) => {
        totals[product.brand] =
          (totals[product.brand] ?? 0) + Number(unitPrice) * quantity;
      });
      return totals;
    }, {});

    // Calculate total revenue
    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.total),
      0
    );

    // Calculate brand share percentages and assign colors
    const colors = ['#5ea8d6', '#72b58d', '#e0a64d', '#bd8bbd'];
    const brandShare = Object.entries(brandTotals)
      .map(([name, value], index) => ({
        name,
        value: totalRevenue ? Math.round((value / totalRevenue) * 1000) / 10 : 0,
        revenue: Math.round(value),
        color: colors[index % 4],
      }))
      .sort((a, b) => b.value - a.value); // Sort by share percentage descending

    return jsonSuccess(
      res,
      {
        brandShare,
        totalRevenue: Math.round(totalRevenue),
        topBrand: brandShare[0] || { name: 'N/A', value: 0, revenue: 0, color: '#5ea8d6' },
      },
      200
    );
  } catch (error) {
    void error;
    return jsonError(
      res,
      'server_error',
      'Unable to fetch brand sales share data',
      500
    );
  }
}
