import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess, validateMethod } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { productCreateSchema, productListQuerySchema } from '@/lib/validators/inventory';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;
  try {
   if (req.method === 'GET') {
    const query = productListQuerySchema.safeParse(req.query);
    if (!query.success) {
      return jsonError(res, 'invalid_query', 'Invalid query parameters.', 400, query.error.flatten());
    }

    const filters = query.data;
    const where: Record<string, unknown> = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { brand: { contains: filters.search } },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.brand) {
      where.brand = { contains: filters.brand };
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: filters.sort === 'stock' ? { inventory: filters.direction } : { [filters.sort]: filters.direction },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return jsonSuccess(
      res,
      {
        items: items.map((item) => ({
          ...item,
          price: Number(item.price),
        })),
        page: filters.page,
        pageSize: filters.pageSize,
        total,
      },
      200
    );
    }

    if (req.method === 'POST') {
    const body = productCreateSchema.safeParse(req.body);
    if (!body.success) {
      return jsonError(res, 'invalid_request', 'Invalid product payload.', 400, body.error.flatten());
    }

    const payload = body.data;
    const brand = await prisma.brand.findFirst({ where: { OR: [{ name: payload.brand }, { slug: payload.brand }] } });
    if (!brand) return jsonError(res, 'invalid_brand', 'Select an existing brand.', 400);
    const nextSlug = payload.slug || payload.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const existing = await prisma.product.findUnique({ where: { slug: nextSlug } });
    if (existing) {
      return jsonError(res, 'duplicate', 'A product with this slug already exists.', 409);
    }

    const maxId = await prisma.product.findFirst({ orderBy: { id: 'desc' }, select: { id: true } });
    const product = await prisma.product.create({
      data: {
        id: (maxId?.id ?? 0) + 1,
        slug: nextSlug,
        catalog: payload.catalog,
        name: payload.name,
        brand: payload.brand,
        price: String(payload.price),
        rating: 0,
        reviews: 0,
        image: payload.image || '/images/placeholder-product.jpg',
        roast: payload.roast,
        process: payload.process,
        origin: payload.origin,
        originRegion: payload.originRegion,
        country: payload.country,
        coffeeType: payload.coffeeType,
        body: payload.body,
        acidity: payload.acidity,
        sweetness: payload.sweetness,
        size: payload.size,
        description: payload.description,
        inStock: payload.inStock,
        inventory: payload.inventory,
        lowStockThreshold: payload.lowStockThreshold,
        status: payload.status,
        brewMethods: payload.brewMethods,
        grindTypes: payload.grindTypes,
        tastingNotes: payload.tastingNotes,
        specialTags: payload.specialTags,
      },
    });

    return jsonSuccess(res, { product: { ...product, price: Number(product.price) } }, 201);
   }

   return validateMethod(req, res, ['GET', 'POST']);
  } catch (error) {
    console.error('[manager/products] failed', error);
    return jsonError(res, 'server_error', 'Unable to load or save products.', 500);
  }
}
