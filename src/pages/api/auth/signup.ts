import type { NextApiRequest, NextApiResponse } from 'next';
import { handleSignup } from '@/lib/auth-utils';
import { signupSchema } from '@/lib/validators/auth';
import { sendValidationError } from '@/lib/api-response';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return sendValidationError(res, 'Method not allowed');
  // validate inputs early with Zod
  try {
    signupSchema.parse(req.body);
  } catch {
    return sendValidationError(res, 'Invalid signup payload');
  }
  return handleSignup(req, res);
}
