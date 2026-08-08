import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonSuccess } from '@/lib/api-utils';

const activity = [
  { id: 'ACT-01', title: 'Placed order ORD-1001', date: '2026-07-10T14:22:00Z' },
  { id: 'ACT-02', title: 'Updated delivery address', date: '2026-07-24T09:15:00Z' },
  { id: 'ACT-03', title: 'Subscribed to seasonal roast', date: '2026-07-27T16:40:00Z' },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireRole(req, res, ['customer', 'manager', 'admin']);
  if (!auth) return;
  return jsonSuccess(res, { activity }, 200);
}
