import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

const statuses = ['PENDING', 'APPROVED', 'REJECTED'] as const;
type ReviewStatus = typeof statuses[number];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;
  if (req.method !== 'GET') return jsonError(res, 'method_not_allowed', 'Method not allowed.', 405);
  try {
    const rawStatus = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : 'ALL';
    if (rawStatus !== 'ALL' && !statuses.includes(rawStatus as ReviewStatus)) return jsonError(res, 'invalid_status', 'Invalid review status.', 400);
    const page = Math.max(1, Number(req.query.page ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 20) || 20));
    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const sort = req.query.sort === 'rating' ? { rating: 'desc' as const } : { createdAt: 'desc' as const };
    const reviews = await prisma.review.findMany({ where: rawStatus === 'ALL' ? {} : { status: rawStatus as ReviewStatus }, orderBy: sort, include: { user: { select: { id: true, name: true, firstName: true, lastName: true, email: true, username: true } } } });
    const productIds = reviews.map((review) => Number(review.productId)).filter((id) => Number.isInteger(id));
    const products = productIds.length ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } }) : [];
    const productMap = new Map(products.map((product) => [String(product.id), product]));
    const mapped = reviews.map((review) => ({ id: review.id, rating: review.rating, title: review.title, body: review.content, status: review.status, createdAt: review.createdAt, moderatedAt: review.moderatedAt, moderatedBy: review.moderatedBy, rejectionReason: review.rejectionReason, product: review.productId ? productMap.get(review.productId) ?? null : null, customer: { name: review.user.name ?? ([review.user.firstName, review.user.lastName].filter(Boolean).join(' ') || review.user.username || 'Community member'), email: review.user.email } })).filter((review) => !search || `${review.title} ${review.body} ${review.product?.name ?? ''} ${review.customer.name}`.toLowerCase().includes(search));
    const total = mapped.length;
    return jsonSuccess(res, { items: mapped.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize }, 200);
  } catch (error) {
    console.error('[manager/reviews] failed', error);
    return jsonError(res, 'server_error', 'Unable to load review moderation data.', 500);
  }
}
