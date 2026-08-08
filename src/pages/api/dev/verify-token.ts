import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyResetToken } from '@/lib/mock-auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { token } = req.body || {};
  if (!token || typeof token !== 'string') return res.status(400).json({ error: 'Invalid token' });

  const entry = verifyResetToken(token);
  if (!entry) return res.status(404).json({ valid: false });
  return res.json({ valid: true, userId: entry.userId, expiresAt: entry.expiresAt });
}
