import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonSuccess } from '@/lib/api-utils';

const activity = [
  {
    id: 'SYS-001',
    title: 'Backup completed',
    date: '2026-07-29T02:15:00Z',
    severity: 'Info',
  },
  {
    id: 'SYS-002',
    title: 'New admin created',
    date: '2026-07-28T11:04:00Z',
    severity: 'Notice',
  },
  {
    id: 'SYS-003',
    title: 'Payment gateway latency spike',
    date: '2026-07-27T18:22:00Z',
    severity: 'Warning',
  },
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const auth = await requireRole(req, res, ['admin']);
  if (!auth) return;
  return jsonSuccess(res, { activity }, 200);
}
