import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonSuccess } from '@/lib/api-utils';

const overview = {
  pendingOrders: 18,
  revenueThisWeek: 12840,
  inventoryAlerts: 6,
  teamResponseRate: '92%',
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;
  return jsonSuccess(res, { overview }, 200);
}
