import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess, validateMethod } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const methodError = validateMethod(req, res, ['GET']);
  if (methodError) return methodError;

  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;

  try {
    const products = await prisma.product.findMany({
      where: { inventory: { lte: 5 } },
      orderBy: [{ inventory: 'asc' }, { name: 'asc' }],
    });

    return jsonSuccess(
      res,
      {
        items: products.map((product) => ({
          ...product,
          price: Number(product.price),
          severity: product.inventory <= 0 ? 'out-of-stock' : product.inventory <= product.lowStockThreshold ? 'low-stock' : 'ok',
        })),
      },
      200
    );
  } catch (error) {
    console.error('[manager/inventory/low-stock] failed', error);
    return jsonError(res, 'server_error', 'Unable to load low-stock products', 500);
  }
}
