import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess, validateMethod } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { productUpdateSchema } from '@/lib/validators/inventory';

const idSchema = z.object({ id: z.coerce.number().int().positive() });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;

  const parsedId = idSchema.safeParse({ id: req.query.id });
  if (!parsedId.success) {
    return jsonError(res, 'invalid_id', 'Invalid product id.', 400, parsedId.error.flatten());
  }

  const id = parsedId.data.id;

  try {
  if (req.method === 'GET') {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return jsonError(res, 'not_found', 'Product not found.', 404);
    return jsonSuccess(res, { product: { ...product, price: Number(product.price) } }, 200);
  }

  if (req.method === 'PATCH') {
    const body = productUpdateSchema.safeParse(req.body);
    if (!body.success) {
      return jsonError(res, 'invalid_request', 'Invalid product update payload.', 400, body.error.flatten());
    }

    const update = body.data;
    const nextSlug = update.slug || update.name ? (update.slug || update.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : undefined;

    const product = await prisma.product.findUnique({ where: { id } });
        if (update.brand) {
          const brand = await prisma.brand.findFirst({ where: { OR: [{ name: update.brand }, { slug: update.brand }] } });
          if (!brand) return jsonError(res, 'invalid_brand', 'Select an existing brand.', 400);
        }
    if (!product) return jsonError(res, 'not_found', 'Product not found.', 404);

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(update.name ? { name: update.name } : {}),
        ...(nextSlug ? { slug: nextSlug } : {}),
        ...(update.brand ? { brand: update.brand } : {}),
        ...(update.price !== undefined ? { price: String(update.price) } : {}),
        ...(update.inventory !== undefined ? { inventory: update.inventory } : {}),
        ...(update.lowStockThreshold !== undefined ? { lowStockThreshold: update.lowStockThreshold } : {}),
        ...(update.status ? { status: update.status } : {}),
        ...(update.description !== undefined ? { description: update.description } : {}),
        ...(update.image !== undefined ? { image: update.image || '/images/placeholder-product.jpg' } : {}),
        ...(update.inStock !== undefined ? { inStock: update.inStock } : {}),
        ...(update.roast !== undefined ? { roast: update.roast } : {}),
        ...(update.process !== undefined ? { process: update.process } : {}),
        ...(update.origin !== undefined ? { origin: update.origin } : {}),
        ...(update.originRegion !== undefined ? { originRegion: update.originRegion } : {}),
        ...(update.country !== undefined ? { country: update.country } : {}),
        ...(update.coffeeType !== undefined ? { coffeeType: update.coffeeType } : {}),
        ...(update.body !== undefined ? { body: update.body } : {}),
        ...(update.acidity !== undefined ? { acidity: update.acidity } : {}),
        ...(update.sweetness !== undefined ? { sweetness: update.sweetness } : {}),
        ...(update.size !== undefined ? { size: update.size } : {}),
        ...(update.brewMethods !== undefined ? { brewMethods: update.brewMethods } : {}),
        ...(update.grindTypes !== undefined ? { grindTypes: update.grindTypes } : {}),
        ...(update.tastingNotes !== undefined ? { tastingNotes: update.tastingNotes } : {}),
        ...(update.specialTags !== undefined ? { specialTags: update.specialTags } : {}),
      },
    });

    return jsonSuccess(res, { product: { ...updated, price: Number(updated.price) } }, 200);
  }

  if (req.method === 'DELETE') {
    const references = await prisma.orderItem.count({ where: { productId: id } });
    if (references > 0) {
      const archived = await prisma.product.update({ where: { id }, data: { status: 'archived', inStock: false } });
      return jsonSuccess(res, { product: { ...archived, price: Number(archived.price) }, deactivated: true, message: 'Product has order history and was archived instead of deleted.' }, 200);
    }
    await prisma.product.delete({ where: { id } });
    return jsonSuccess(res, { deleted: true, id }, 200);
  }

  return validateMethod(req, res, ['GET', 'PATCH', 'DELETE']);
  } catch (error) {
    console.error('[manager/products/:id] failed', error);
    return jsonError(res, 'server_error', 'Unable to load or update product.', 500);
  }
}
