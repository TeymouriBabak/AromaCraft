import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getSessionByCookieValue } from '@/lib/db-auth';

const SESSION_COOKIE_NAME = 'aromacraft_sid';

async function getUserId(req: NextApiRequest): Promise<string | null> {
  const cookieValue = req.cookies[SESSION_COOKIE_NAME];
  if (!cookieValue) return null;
  const session = await getSessionByCookieValue(cookieValue);
  return session?.user?.id ?? null;
}

function parseProductIds(input: unknown): number[] {
  if (!Array.isArray(input)) return [];
  const ids = input
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
  return Array.from(new Set(ids));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const productIds = parseProductIds(
    (req.body as { productIds?: unknown })?.productIds
  );

  if (productIds.length > 0) {
    const existing = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });

    if (existing.length > 0) {
      await prisma.wishlistItem.createMany({
        data: existing.map(({ id }) => ({ userId, productId: id })),
        skipDuplicates: true,
      });
    }
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { productId: true },
  });

  return res.status(200).json({ productIds: items.map((i) => i.productId) });
}
