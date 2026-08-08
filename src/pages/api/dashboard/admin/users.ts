import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonSuccess } from '@/lib/api-utils';
import { devListUsers } from '@/lib/mock-auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireRole(req, res, ['admin']);
  if (!auth) return;

  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const users = devListUsers();
  const start = (page - 1) * limit;
  return jsonSuccess(res, { items: users.slice(start, start + limit), page, limit, total: users.length }, 200);
}
