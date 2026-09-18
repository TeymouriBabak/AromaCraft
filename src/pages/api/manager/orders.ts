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
    const requestedStatus = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : 'ALL';
    const statusAliases: Record<string, string> = { PENDING: 'PENDING', COMPLETED: 'DELIVERED' };
    const status = statusAliases[requestedStatus] ?? requestedStatus;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const from = typeof req.query.from === 'string' ? req.query.from : '';
    const to = typeof req.query.to === 'string' ? req.query.to : '';
    const sortField = typeof req.query.sort === 'string' ? req.query.sort : 'createdAt';
    const sortDirection = typeof req.query.direction === 'string' ? req.query.direction : 'desc';
    const page = Number(req.query.page ?? '1');
    const pageSize = Number(req.query.pageSize ?? '20');

    const safeSortFields = new Set(['createdAt', 'total', 'status']);
    const safeStatuses = new Set(['ALL', 'PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']);

    if (!safeSortFields.has(sortField)) {
      return jsonError(res, 'invalid_sort', 'Invalid sort field.', 400);
    }
    if (!['asc', 'desc'].includes(sortDirection.toLowerCase())) {
      return jsonError(res, 'invalid_sort', 'Invalid sort direction.', 400);
    }
    if (!Number.isFinite(page) || page < 1) {
      return jsonError(res, 'invalid_page', 'Page must be >= 1.', 400);
    }
    const safePageSize = Math.min(Math.max(pageSize || 20, 1), 100);

    const where: Record<string, unknown> = {};
    if (status !== 'ALL' && safeStatuses.has(status)) {
      where.status = status;
    }
    const createdAtFilter: Record<string, Date | string> = {};
    if (from) createdAtFilter.gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      createdAtFilter.lte = end;
    }
    if (Object.keys(createdAtFilter).length > 0) {
      where.createdAt = createdAtFilter;
    }
    if (search) {
      const likeSearch = search.replace(/[\%_]/g, '\\$&');
      where.OR = [
        { id: { contains: likeSearch } },
        { user: { email: { contains: likeSearch } } },
        { user: { firstName: { contains: likeSearch } } },
        { user: { lastName: { contains: likeSearch } } },
        { user: { username: { contains: likeSearch } } },
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { [sortField]: sortDirection.toLowerCase() },
        skip: (page - 1) * safePageSize,
        take: safePageSize,
        include: {
          user: { select: { id: true, username: true, firstName: true, lastName: true, email: true, name: true } },
          items: { include: { product: { select: { id: true, name: true, brand: true, price: true } } } },
        },
      }),
    ]);

    return jsonSuccess(
      res,
      {
        data: rows.map((order) => ({
          id: order.id,
          status: order.status,
          subtotal: Number(order.subtotal),
          shippingFee: Number(order.shippingFee),
          total: Number(order.total),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          customerName:
            order.user?.name ??
            ([order.user?.firstName, order.user?.lastName].filter(Boolean).join(' ') ||
              order.user?.username ||
              order.user?.email ||
              'Unknown customer'),
          customerEmail: order.user?.email ?? null,
          user: order.user,
          items: order.items.map((item) => ({
            id: item.id,
            orderId: item.orderId,
            productId: item.productId,
            quantity: item.quantity,
            name: item.product?.name ?? 'AromaCraft item',
            brand: item.product?.brand ?? null,
            unitPrice: Number(item.unitPrice),
            price: Number(item.unitPrice),
          })),
        })),
        total,
        page,
        pageSize: safePageSize,
      },
      200
    );
  } catch (error) {
    console.error('[manager/orders] failed', error);
    return jsonError(res, 'server_error', 'Unable to load manager orders', 500);
  }
}
