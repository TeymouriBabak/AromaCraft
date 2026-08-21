import type { NextApiRequest, NextApiResponse } from 'next';
import { handleMe } from '@/lib/auth-utils';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleMe(req, res);
}
