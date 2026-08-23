import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonSuccess } from '@/lib/api-utils';

const team = [
  { name: 'Mina R.', role: 'Sales', tasks: 9, workload: 'High' },
  { name: 'Daniel T.', role: 'Inventory', tasks: 4, workload: 'Medium' },
  { name: 'Sophie L.', role: 'Support', tasks: 6, workload: 'High' },
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const auth = await requireRole(req, res, ['admin', 'manager']);
  if (!auth) return;
  return jsonSuccess(res, { team }, 200);
}
