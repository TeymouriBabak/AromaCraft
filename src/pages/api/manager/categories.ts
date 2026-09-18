import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess, validateMethod } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

const categorySchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2).optional(),
  description: z.string().trim().optional().default(''),
  isVisible: z.boolean().optional().default(true),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;

  if (req.method === 'GET') {
    const categories = await prisma.product.findMany({
      where: { catalog: 'shop' },
      select: { brand: true },
      distinct: ['brand'],
      orderBy: { brand: 'asc' },
    });

    return jsonSuccess(
      res,
      {
        items: categories.map((category, index) => ({
          id: `brand-${index + 1}`,
          name: category.brand,
          slug: category.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: '',
          isVisible: true,
        })),
      },
      200
    );
  }

  if (req.method === 'POST') {
    const payload = categorySchema.safeParse(req.body);
    if (!payload.success) {
      return jsonError(res, 'invalid_request', 'Invalid category payload.', 400, payload.error.flatten());
    }

    const slug = (payload.data.slug ?? payload.data.name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return jsonSuccess(
      res,
      {
        item: {
          id: `category-${Date.now()}`,
          name: payload.data.name,
          slug,
          description: payload.data.description,
          isVisible: payload.data.isVisible,
        },
      },
      201
    );
  }

  return validateMethod(req, res, ['GET', 'POST']);
}
