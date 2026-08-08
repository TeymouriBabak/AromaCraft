import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonSuccess } from '@/lib/api-utils';

const overview = {
  totalUsers: 1782,
  activeManagers: 6,
  monthlyRevenue: 214500,
  systemHealth: 'Stable',
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireRole(req, res, ['admin']);
  if (!auth) return;
  return jsonSuccess(res, { overview }, 200);
}
