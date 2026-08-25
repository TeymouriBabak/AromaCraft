import type { NextApiRequest, NextApiResponse } from 'next';
import { handleVerifyLogin } from '@/lib/auth-utils';
import { verifyLoginSchema } from '@/lib/validators/auth';
import { sendValidationError } from '@/lib/api-response';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    return sendValidationError(res, 'Method not allowed');
  try {
    const body =
      typeof req.body === 'object' && req.body ? req.body : {};
    verifyLoginSchema.parse(body);
  } catch {
    return sendValidationError(res, 'Invalid verification payload');
  }
  return handleVerifyLogin(req, res);
}
