import type { NextApiRequest, NextApiResponse } from 'next';
import { handleLogout } from '@/lib/auth-utils';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleLogout(req, res);
}
