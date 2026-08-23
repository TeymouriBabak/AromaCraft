import type { NextApiRequest, NextApiResponse } from 'next';
import { requireSession } from '@/lib/auth-utils';
import { jsonError, jsonSuccess, validateMethod } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const methodError = validateMethod(req, res, ['GET']);
  if (methodError) return methodError;

  const auth = await requireSession(req, res);
  if (!auth) return;

  if (auth.user.role === 'admin' || auth.user.role === 'manager') {
    const orders = await prisma.order.findMany({
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return jsonSuccess(res, { orders }, 200);
  }

  const orders = await prisma.order.findMany({
    where: { userId: auth.user.id },
    include: {
      items: { include: { product: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!orders) return jsonError(res, 'not_found', 'No orders found.', 404);
  return jsonSuccess(res, { orders }, 200);
}
