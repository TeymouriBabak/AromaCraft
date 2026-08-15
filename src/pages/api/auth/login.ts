import type { NextApiRequest, NextApiResponse } from 'next';
import { handleLogin } from '@/lib/auth-utils';
import { loginSchema } from '@/lib/validators/auth';
import { sendValidationError } from '@/lib/api-response';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return sendValidationError(res, 'Method not allowed');
  try {
    loginSchema.parse(req.body);
    } catch {
      return sendValidationError(res, 'Invalid login payload');
    }
  return handleLogin(req, res);
}
