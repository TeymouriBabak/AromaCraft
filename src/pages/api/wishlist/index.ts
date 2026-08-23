import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSessionByCookieValue } from '@/lib/db-auth';

const SESSION_COOKIE_NAME = 'aromacraft_sid';

const mutateSchema = z.object({
  productId: z.coerce.number().int().positive(),
});

async function getSessionUserId(req: NextApiRequest): Promise<string | null> {
  const cookieValue = req.cookies[SESSION_COOKIE_NAME];
  if (!cookieValue) return null;
  const session = await getSessionByCookieValue(cookieValue);
  return session?.user?.id ?? null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = await getSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const items = await prisma.wishlistItem.findMany({
      where: { userId },
      select: { productId: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ productIds: items.map((i) => i.productId) });
  }

  if (req.method === 'POST') {
    const parsed = mutateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid product id' });
    }
    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId, productId: parsed.data.productId } },
      create: { userId, productId: parsed.data.productId },
      update: {},
    });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const parsed = mutateSchema.safeParse(
      req.body && Object.keys(req.body).length ? req.body : req.query
    );
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid product id' });
    }
    await prisma.wishlistItem.deleteMany({
      where: { userId, productId: parsed.data.productId },
    });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
