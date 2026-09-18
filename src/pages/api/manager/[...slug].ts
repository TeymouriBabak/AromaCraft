import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess } from '@/lib/api-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['admin', 'manager']);
  if (!auth) return;
  const slug = (req.query.slug as string[] | undefined)?.join('/') ?? '';
  try {
    if (req.method === 'PATCH' && slug.startsWith('customers/')) {
      const id = slug.split('/')[1];
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user || user.role !== 'CUSTOMER') return jsonError(res, 'not_found', 'Customer not found', 404);
      const banned = user.isBanned;
      const updated = await prisma.user.update({ where: { id }, data: { isBanned: !banned, bannedAt: banned ? null : new Date(), bannedBy: banned ? null : auth.user.id } });
      const identifiers = [{ type: 'email', value: user.email }, { type: 'username', value: user.username }, ...(user.mobile ? [{ type: 'phone', value: user.mobile }] : [])];
      if (banned) await prisma.bannedIdentity.deleteMany({ where: { OR: identifiers } });
      else await prisma.bannedIdentity.createMany({ data: identifiers, skipDuplicates: true });
      return jsonSuccess(res, { customer: updated }, 200);
    }
    if (slug === 'customers' || slug === 'customers/all-customers' || slug === 'customers/banned-list') {
      const users = await prisma.user.findMany({ where: { role: 'CUSTOMER', ...(slug.endsWith('banned-list') ? { isBanned: true } : {}) }, orderBy: { createdAt: 'desc' }, select: { id: true, firstName: true, lastName: true, username: true, email: true, mobile: true, gender: true, createdAt: true, isBanned: true, avatarUrl: true } });
      return jsonSuccess(res, { items: users }, 200);
    }
    if (['all-orders', 'pending-orders', 'completed-orders', 'refund-requests'].includes(slug)) {
      const statusFilter =
        slug === 'pending-orders'
          ? ['PENDING', 'PROCESSING']
          : slug === 'completed-orders'
            ? ['DELIVERED']
            : slug === 'refund-requests'
              ? ['CANCELLED']
              : undefined;
      const orders = await prisma.order.findMany({
        where: statusFilter
          ? { status: { in: statusFilter as Array<'PENDING' | 'PROCESSING' | 'DELIVERED' | 'CANCELLED'> } }
          : { status: { not: 'CANCELLED' } },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { username: true, firstName: true, lastName: true, email: true } },
          items: { include: { product: { select: { name: true, brand: true } } } },
        },
      });
      return jsonSuccess(res, { items: orders }, 200);
    }
    if (slug.startsWith('orders')) {
      const status = slug.includes('pending') ? 'PENDING' : slug.includes('completed') ? 'DELIVERED' : undefined;
      const orders = await prisma.order.findMany({ where: status ? { status } : { status: { not: 'CANCELLED' } }, orderBy: { createdAt: 'desc' }, include: { user: { select: { username: true, firstName: true, lastName: true } }, items: { include: { product: { select: { name: true, brand: true } } } } } });
      return jsonSuccess(res, { items: orders }, 200);
    }
    if (slug.includes('inventory') || slug.includes('product') || slug.includes('shop')) {
      const products = await prisma.product.findMany({ where: { catalog: 'shop', ...(slug.includes('low-stock') ? { inventory: { lte: 15 } } : {}) }, orderBy: { inventory: 'asc' } });
      return jsonSuccess(res, { items: products }, 200);
    }
    if (slug.includes('review')) {
      const reviews = await prisma.review.findMany({ where: slug.includes('pending') ? { isHidden: true, hiddenAt: null } : slug.includes('approved') ? { isHidden: false } : {}, orderBy: { createdAt: 'desc' }, include: { user: { select: { username: true, firstName: true, lastName: true, avatarUrl: true } } } });
      return jsonSuccess(res, { items: reviews }, 200);
    }
    if (slug.includes('admin')) {
      const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'MANAGER'] } }, orderBy: { createdAt: 'desc' }, select: { id: true, firstName: true, lastName: true, username: true, email: true, createdAt: true, isBanned: true } });
      return jsonSuccess(res, { items: admins }, 200);
    }
    return jsonSuccess(res, { items: [] }, 200);
  } catch {
    return jsonError(res, 'server_error', 'Unable to load manager data', 500);
  }
}