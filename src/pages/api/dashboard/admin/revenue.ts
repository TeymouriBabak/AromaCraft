import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonSuccess } from '@/lib/api-utils';

const revenue = Array.from({ length: 12 }).map((_, i) => ({
  month: `M${i + 1}`,
  revenue: 18000 + i * 1200,
  target: 16500 + i * 1100,
}));

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const auth = await requireRole(req, res, ['admin']);
  if (!auth) return;
  return jsonSuccess(res, { revenue }, 200);
}
