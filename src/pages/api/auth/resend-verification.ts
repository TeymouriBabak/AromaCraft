import type { NextApiRequest, NextApiResponse } from 'next';
import { handleResendVerification } from '@/lib/auth-utils';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleResendVerification(req, res);
}
