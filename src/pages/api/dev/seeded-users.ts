import type { NextApiRequest, NextApiResponse } from 'next';
import { devListUsers } from '@/lib/mock-users';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.json({ users: devListUsers() });
}
