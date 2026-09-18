import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess, validateMethod } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { shopFilterSchema } from '@/lib/validators/inventory';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;

  try {
  if (req.method === 'GET') {
    const filters = await prisma.shopFilter.findMany({ orderBy: { sortOrder: 'asc' } });
    return jsonSuccess(res, { items: filters }, 200);
  }

  if (req.method === 'PUT') {
    const body = shopFilterSchema.safeParse(req.body);
    if (!body.success) {
      return jsonError(res, 'invalid_request', 'Invalid shop filter payload.', 400, body.error.flatten());
    }

    const filter = body.data;
    const existing = await prisma.shopFilter.findUnique({ where: { key: filter.key } });
    if (!existing) {
      const created = await prisma.shopFilter.create({ data: { ...filter, options: filter.options } });
      return jsonSuccess(res, { item: created }, 201);
    }

    const updated = await prisma.shopFilter.update({
      where: { id: existing.id },
      data: { ...filter, options: filter.options },
    });

    return jsonSuccess(res, { item: updated }, 200);
  }

  return validateMethod(req, res, ['GET', 'PUT']);
  } catch (error) {
    console.error('[manager/shop-filters] failed', error);
    return jsonError(res, 'server_error', 'Unable to load or save shop filters.', 500);
  }
}
