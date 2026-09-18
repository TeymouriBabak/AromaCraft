import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess, validateMethod } from '@/lib/api-utils';
import { can } from '@/lib/auth/permissions';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const methodError = validateMethod(req, res, ['GET']);
  if (methodError) return methodError;

  const auth = await requireRole(req, res, ['admin', 'manager']);
  if (!auth) return;

  if (!can(auth.user.role, 'dashboard:overview')) {
    return jsonError(res, 'forbidden', 'Access denied.', 403);
  }

  try {
    // Get last 12 months of revenue
    const revenue = [];
    const today = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      date.setDate(1);
      date.setHours(0, 0, 0, 0);

      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const monthRevenue = await prisma.order.aggregate({
        where: {
          createdAt: { gte: date, lt: nextMonth },
        },
        _sum: { total: true },
      });

      revenue.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: monthRevenue._sum.total ? Number(monthRevenue._sum.total) : 0,
      });
    }

    return jsonSuccess(res, { data: revenue }, 200);
  } catch (error) {
    console.error('[admin/revenue]', error);
    return jsonError(res, 'internal_error', 'Failed to fetch revenue.', 500);
  }
}
