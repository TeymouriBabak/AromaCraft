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

  if (!can(auth.user.role, 'activity:read')) {
    return jsonError(res, 'forbidden', 'Access denied.', 403);
  }

  try {
    const limit = Math.min(Math.max(Number(req.query.limit ?? '50'), 1), 200);

    const activities = await prisma.userActivity.findMany({
      select: {
        id: true,
        action: true,
        createdAt: true,
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return jsonSuccess(
      res,
      {
        data: activities.map((activity) => ({
          id: activity.id,
          action: activity.action,
          user: activity.user?.username || activity.user?.email || 'Unknown',
          timestamp: activity.createdAt,
        })),
      },
      200
    );
  } catch (error) {
    console.error('[admin/activity]', error);
    return jsonError(res, 'internal_error', 'Failed to fetch activity.', 500);
  }
}
