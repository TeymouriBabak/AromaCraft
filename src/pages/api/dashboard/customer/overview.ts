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

  const auth = await requireRole(req, res, ['customer', 'admin', 'manager']);
  if (!auth) return;

  if (!can(auth.user.role, 'dashboard:overview')) {
    return jsonError(
      res,
      'forbidden',
      'You do not have permission to access this dashboard.',
      403
    );
  }

  try {
    // For customer role, only show their own data
    const userId = auth.user.role === 'customer' ? auth.user.id : undefined;

    const [orderCount, totalSpent, lastOrder] = await Promise.all([
      prisma.order.count({
        where: userId ? { userId } : {},
      }),
      prisma.order.aggregate({
        where: userId ? { userId } : {},
        _sum: { total: true },
      }),
      prisma.order.findFirst({
        where: userId ? { userId } : {},
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    // Simple loyalty tier based on total spent
    let loyaltyTier = 'Bronze';
    const totalSpentAmount = totalSpent._sum.total ? Number(totalSpent._sum.total) : 0;
    if (totalSpentAmount > 500) loyaltyTier = 'Gold';
    else if (totalSpentAmount > 250) loyaltyTier = 'Silver';

    return jsonSuccess(
      res,
      {
        overview: {
          welcome: `Welcome back${auth.user.firstName ? `, ${auth.user.firstName}` : ''}!`,
          orderCount,
          totalSpent: totalSpentAmount,
          loyaltyTier,
          lastOrderDate: lastOrder?.createdAt || null,
          nextReward: loyaltyTier === 'Gold' ? 'Free 250g roast' : 'Earn more to reach Silver',
        },
      },
      200
    );
  } catch (error) {
    console.error('[customer/overview]', error);
    return jsonError(
      res,
      'internal_error',
      'Failed to fetch customer overview.',
      500
    );
  }
}
