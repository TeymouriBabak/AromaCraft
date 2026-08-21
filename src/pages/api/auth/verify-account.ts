import type { NextApiRequest, NextApiResponse } from 'next';
import { handleVerifyAccount } from '@/lib/auth-utils';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleVerifyAccount(req, res);
}
