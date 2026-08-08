import type { NextApiRequest, NextApiResponse } from 'next';
import { handleSignup } from '@/lib/auth-utils';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleSignup(req, res);
}
