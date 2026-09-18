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

  if (!can(auth.user.role, 'product:read')) {
    return jsonError(res, 'forbidden', 'Access denied.', 403);
  }

  try {
    const page = Math.max(1, Number(req.query.page ?? '1'));
    const limit = Math.min(Math.max(Number(req.query.limit ?? '20'), 1), 100);
    const lowStockOnly = req.query.lowStock === 'true';

    const where: Record<string, unknown> = {};
    if (lowStockOnly) {
      where.inventory = { lte: 5 };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          brand: true,
          price: true,
          inventory: true,
          lowStockThreshold: true,
        },
        orderBy: { inventory: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return jsonSuccess(
      res,
      {
        data: products.map((product) => ({
          id: product.id,
          name: product.name,
          brand: product.brand,
          price: Number(product.price),
          stock: product.inventory,
          threshold: product.lowStockThreshold,
          status: product.inventory <= product.lowStockThreshold ? 'Low' : 'OK',
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
    console.error('[admin/inventory]', error);
    return jsonError(res, 'internal_error', 'Failed to fetch inventory.', 500);
  }
}
