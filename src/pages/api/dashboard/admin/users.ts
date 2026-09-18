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
    const page = Math.max(1, Number(req.query.page ?? '1'));
    const limit = Math.min(Math.max(Number(req.query.limit ?? '20'), 1), 100);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { username: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isBanned: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return jsonSuccess(
      res,
      {
        data: users.map((user) => ({
          id: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
          email: user.email,
          role: user.role,
          status: user.isBanned ? 'Banned' : 'Active',
          joinDate: user.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      200
    );
  } catch (error) {
    console.error('[admin/users]', error);
    return jsonError(res, 'internal_error', 'Failed to fetch users.', 500);
  }
}
