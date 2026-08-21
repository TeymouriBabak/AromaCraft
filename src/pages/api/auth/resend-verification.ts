import type { NextApiRequest, NextApiResponse } from 'next';
import { handleResendVerification } from '@/lib/auth-utils';
import { resendVerificationSchema } from '@/lib/validators/auth';
import { sendValidationError } from '@/lib/api-response';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return sendValidationError(res, 'Method not allowed');

  try {
    resendVerificationSchema.parse(req.body);
  } catch {
    return sendValidationError(res, 'Invalid resend verification payload');
  }

  return handleResendVerification(req, res);
}
