import type { NextApiRequest, NextApiResponse } from 'next';
import { handleLogin } from '@/lib/auth-utils';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleLogin(req, res);
}
