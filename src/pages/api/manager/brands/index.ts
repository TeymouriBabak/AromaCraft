import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess, validateMethod } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { brandSchema } from '@/lib/validators/inventory';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;

  try {
  if (req.method === 'GET') {
    const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });
    const counts = await prisma.product.groupBy({ by: ['brand'], _count: { _all: true } });
    const countMap = new Map(counts.map((item) => [item.brand, item._count._all]));
    return jsonSuccess(res, { items: brands.map((brand) => ({ ...brand, productCount: countMap.get(brand.name) ?? 0 })) }, 200);
  }

  if (req.method === 'POST') {
    const payload = brandSchema.safeParse(req.body);
    if (!payload.success) {
      return jsonError(res, 'invalid_request', 'Invalid brand payload.', 400, payload.error.flatten());
    }

    const slug = payload.data.slug || payload.data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const existing = await prisma.brand.findUnique({ where: { slug } });
    if (existing) {
      return jsonError(res, 'duplicate', 'Brand with this slug already exists.', 409);
    }

    const brand = await prisma.brand.create({
      data: { name: payload.data.name, slug, description: payload.data.description, isActive: payload.data.isActive ?? true },
    });
    return jsonSuccess(res, { brand: { ...brand, productCount: 0 } }, 201);
  }

  return validateMethod(req, res, ['GET', 'POST']);
  } catch (error) {
    console.error('[manager/brands] failed', error);
    return jsonError(res, 'server_error', 'Unable to load or save brands.', 500);
  }
}
