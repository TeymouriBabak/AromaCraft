import type { NextApiRequest, NextApiResponse } from 'next';
import { handleLogin } from '@/lib/auth-utils';
import { loginSchema } from '@/lib/validators/auth';
import { sendValidationError } from '@/lib/api-response';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return sendValidationError(res, 'Method not allowed');
  try {
    // Accept legacy clients that don't include `loginMode` by defaulting to 'email'
    const body = { loginMode: 'email', ...(typeof req.body === 'object' && req.body ? req.body : {}) };
    loginSchema.parse(body);
    } catch {
      return sendValidationError(res, 'Invalid login payload');
    }
  return handleLogin(req, res);
}
