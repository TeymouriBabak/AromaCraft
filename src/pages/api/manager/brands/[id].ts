import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess, validateMethod } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { brandSchema } from '@/lib/validators/inventory';

const idSchema = z.object({ id: z.string().min(1) });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;

  const parsedId = idSchema.safeParse({ id: req.query.id });
  if (!parsedId.success) {
    return jsonError(res, 'invalid_id', 'Invalid brand id.', 400, parsedId.error.flatten());
  }

  const id = parsedId.data.id;

  try {
  if (req.method === 'PATCH') {
    const payload = brandSchema.safeParse(req.body);
    if (!payload.success) {
      return jsonError(res, 'invalid_request', 'Invalid brand payload.', 400, payload.error.flatten());
    }

    const brand = await prisma.brand.findUnique({ where: { id } });
    if (!brand) return jsonError(res, 'not_found', 'Brand not found.', 404);

    const slug = payload.data.slug || payload.data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const updated = await prisma.brand.update({
      where: { id },
      data: {
        name: payload.data.name,
        slug,
        description: payload.data.description,
        isActive: payload.data.isActive ?? brand.isActive,
      },
    });

    return jsonSuccess(res, { brand: updated }, 200);
  }

  if (req.method === 'DELETE') {
    const brand = await prisma.brand.findUnique({ where: { id } });
    if (!brand) return jsonError(res, 'not_found', 'Brand not found.', 404);
    const products = await prisma.product.count({ where: { brand: brand.name } });
    if (products > 0) {
      return jsonError(res, 'conflict', 'Brand is still assigned to products and cannot be deleted.', 409);
    }

    await prisma.brand.delete({ where: { id } });
    return jsonSuccess(res, { deleted: true }, 200);
  }

  return validateMethod(req, res, ['PATCH', 'DELETE']);
  } catch (error) {
    console.error('[manager/brands/:id] failed', error);
    return jsonError(res, 'server_error', 'Unable to update or delete brand.', 500);
  }
}
