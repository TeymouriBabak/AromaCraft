import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonSuccess } from '@/lib/api-utils';

const overviewData = {
  welcome: 'Welcome back to your AromaCraft profile.',
  loyaltyTier: 'Gold',
  nextReward: 'Free 250g roast on your next order',
  pointsBalance: 1830,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const auth = await requireRole(req, res, ['customer', 'admin', 'manager']);
  if (!auth) return;
  return jsonSuccess(res, { overview: overviewData }, 200);
}
