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
