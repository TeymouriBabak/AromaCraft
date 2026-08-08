import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonSuccess } from '@/lib/api-utils';

const orders = [
  { id: 'ORD-2101', customer: 'Tbabak', total: 68.0, status: 'Delivered' },
  { id: 'ORD-2102', customer: 'Mina R.', total: 96.5, status: 'Processing' },
  { id: 'ORD-2103', customer: 'Daniel T.', total: 118.4, status: 'Pending' },
  { id: 'ORD-2104', customer: 'Sophie L.', total: 54.7, status: 'Shipped' },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;

  const statusFilter = String(req.query.status || '').toLowerCase();
  const filtered = statusFilter ? orders.filter((order) => order.status.toLowerCase() === statusFilter) : orders;
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);
  return jsonSuccess(res, { items, page, limit, total: filtered.length }, 200);
}
