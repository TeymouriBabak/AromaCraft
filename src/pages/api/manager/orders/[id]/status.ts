import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess, validateMethod } from '@/lib/api-utils';

const allowedStatuses = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;
const orderIdSchema = z.object({ id: z.string().min(1) });
const statusSchema = z.object({ status: z.enum(allowedStatuses) });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;

  const parsedId = orderIdSchema.safeParse({ id: req.query.id });
  if (!parsedId.success) {
    return jsonError(res, 'invalid_id', 'Invalid order id.', 400, parsedId.error.flatten());
  }

  if (req.method === 'PATCH') {
    const parsedBody = statusSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return jsonError(res, 'invalid_request', 'Invalid status payload.', 400, parsedBody.error.flatten());
    }

    const order = await prisma.order.findUnique({ where: { id: parsedId.data.id } });
    if (!order) {
      return jsonError(res, 'not_found', 'Order not found.', 404);
    }

    const updated = await prisma.order.update({
      where: { id: parsedId.data.id },
      data: { status: parsedBody.data.status },
    });

    return jsonSuccess(res, { order: updated }, 200);
  }

  if (req.method === 'GET') {
    const order = await prisma.order.findUnique({
      where: { id: parsedId.data.id },
      include: {
        user: { select: { id: true, username: true, firstName: true, lastName: true, email: true } },
        items: { include: { product: { select: { id: true, name: true, brand: true, price: true } } } },
      },
    });

    if (!order) {
      return jsonError(res, 'not_found', 'Order not found.', 404);
    }

    return jsonSuccess(res, { order }, 200);
  }

  return validateMethod(req, res, ['GET', 'PATCH']);
}
