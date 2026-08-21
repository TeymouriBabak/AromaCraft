import type { NextApiRequest, NextApiResponse } from 'next';
import { requireSession } from '@/lib/auth-utils';
import { jsonError, jsonSuccess, parseJsonBody, validateMethod } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { calculateOrderTotals } from '@/lib/security-guards';

const OrderSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  address: z.string().min(1),
  items: z.array(
    z.object({ productId: z.string().min(1), quantity: z.number().min(1).max(10), size: z.string().optional(), grindType: z.string().optional() }),
  ).min(1),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

  const auth = await requireSession(req, res);
  if (!auth) return null;

  const body = parseJsonBody(req);
  if (!body) return jsonError(res, 'invalid_request', 'Request body is required.', 400);

  const parsed = OrderSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(res, 'invalid_request', parsed.error.message || 'Invalid order payload.', 400);
  }

  const productIds = parsed.data.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });

  if (products.length !== new Set(productIds).size) {
    return jsonError(res, 'invalid_request', 'One or more products are unavailable.', 400);
  }

  const { subtotal, shippingFee, total } = calculateOrderTotals(
    parsed.data.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    products.map((product) => ({ id: product.id, price: Number(product.price) })),
  );

  const quantityByProduct = new Map<string, number>();
  for (const item of parsed.data.items) {
    quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) ?? 0) + item.quantity);
  }

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      for (const [productId, quantity] of quantityByProduct) {
        const result = await tx.product.updateMany({
          where: { id: productId, isActive: true, inventory: { gte: quantity } },
          data: { inventory: { decrement: quantity } },
        });
        if (result.count === 0) {
          throw new Error(`INSUFFICIENT_INVENTORY:${productId}`);
        }
      }

      return tx.order.create({
        data: {
          userId: auth.user.id,
          subtotal,
          shippingFee,
          total,
          status: 'PENDING',
          items: {
            create: parsed.data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: Number(products.find((product) => product.id === item.productId)?.price ?? 0),
            })),
          },
        },
        include: { items: true },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('INSUFFICIENT_INVENTORY:')) {
      const productId = error.message.split(':')[1];
      return jsonError(res, 'insufficient_inventory', `Not enough inventory for product ${productId}.`, 409);
    }
    throw error;
  }

  return jsonSuccess(res, { order, subtotal, shippingFee, total }, 201);
}
