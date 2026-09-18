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
    const [totalProducts, activeBrands, activeProducts, draftProducts, inventoryValue, inventorySummary, productRows] = await Promise.all([
      prisma.product.count(),
      prisma.brand.count({ where: { isActive: true } }),
      prisma.product.count({ where: { status: 'active' } }),
      prisma.product.count({ where: { status: 'draft' } }),
      prisma.product.aggregate({ _sum: { price: true } }),
      prisma.product.aggregate({ _sum: { inventory: true } }),
      prisma.product.findMany({ select: { inventory: true, lowStockThreshold: true } }),
    ]);
    console.info('[manager/inventory/summary] product rows', productRows.length);

    const totalInventoryUnits = Number(inventorySummary._sum.inventory ?? 0);
    const totalInventoryValue = Number(inventoryValue._sum.price ?? 0) * totalInventoryUnits;
    const lowStockCount = productRows.filter((product) => product.inventory <= product.lowStockThreshold).length;
    const outOfStockCount = productRows.filter((product) => product.inventory === 0).length;

    return jsonSuccess(
      res,
      {
        totalProducts,
        activeProducts,
        lowStockCount,
        outOfStockCount,
        outOfStock: outOfStockCount,
        totalBrands: activeBrands,
        activeBrands,
        lowStock: lowStockCount,
        totalStockUnits: totalInventoryUnits,
        inventoryValue: totalInventoryValue,
        draftProducts,
      },
      200
    );
  } catch (error) {
    console.error('[manager/inventory/summary] failed', error);
    return jsonError(res, 'server_error', 'Unable to load inventory summary', 500);
  }
}
