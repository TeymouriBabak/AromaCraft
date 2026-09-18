import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess, validateMethod } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const methodError = validateMethod(req, res, ['GET']);
  if (methodError) return methodError;

  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;

  try {
    const rawCount = await prisma.order.count();
    console.info('[manager/orders/completed] raw order count', rawCount);
    const orders = await prisma.order.findMany({
      where: { status: 'DELIVERED' },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            name: true,
          },
        },
        items: {
          include: { product: { select: { name: true, brand: true } } },
        },
      },
    });

    return jsonSuccess(
      res,
      {
        orders: orders.map((order) => ({
          id: order.id,
          status: order.status,
          total: Number(order.total),
          createdAt: order.createdAt,
          customerName:
            order.user?.name ??
            ([order.user?.firstName, order.user?.lastName]
              .filter(Boolean)
              .join(' ') ||
              order.user?.username ||
              order.user?.email ||
              'Unknown customer'),
          customerEmail: order.user?.email ?? null,
          items: order.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            name: item.product?.name ?? 'AromaCraft item',
            price: Number(item.unitPrice),
            unitPrice: Number(item.unitPrice),
          })),
        })),
      },
      200
    );
  } catch (error) {
    console.error('[manager/orders/completed] failed', error);
    return jsonError(
      res,
      'server_error',
      'Unable to load completed orders',
      500
    );
  }
}
