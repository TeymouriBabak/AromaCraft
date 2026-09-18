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

  if (!can(auth.user.role, 'user:read')) {
    return jsonError(res, 'forbidden', 'Access denied.', 403);
  }

  try {
    // Get admins only
    const team = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return jsonSuccess(
      res,
      {
        data: team.map((admin) => ({
          id: admin.id,
          name: `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || admin.username,
          email: admin.email,
          role: 'Admin',
          joinDate: admin.createdAt,
        })),
      },
      200
    );
  } catch (error) {
    console.error('[admin/team]', error);
    return jsonError(res, 'internal_error', 'Failed to fetch team.', 500);
  }
}
