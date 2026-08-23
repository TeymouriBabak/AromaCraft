import type { NextApiRequest, NextApiResponse } from 'next';
import { devOnly } from '@/lib/middleware/devGuard';
import {
  sendSuccess,
  sendMethodNotAllowed,
  sendValidationError,
  sendNotFound,
} from '@/lib/api-response';
import { getLatestMockVerificationOtp } from '@/lib/auth-utils';

export default devOnly(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, ['POST']);
  }

  const { email, type } = req.body || {};
  if (!email || typeof email !== 'string') {
    return sendValidationError(res, 'Email is required and must be a string.');
  }

  const verificationType =
    type === 'LOGIN_OTP' || type === 'PURCHASE_OTP'
      ? type
      : 'EMAIL_VERIFICATION';
  // Require explicit opt-in for this sensitive dev endpoint
  if (process.env.ENABLE_DEV_OTP_ENDPOINT !== 'true') {
    return sendNotFound(res, 'This endpoint is not available.');
  }

  const code = getLatestMockVerificationOtp(email, verificationType);
  // Return presence only; code is included for narrow local development debugging
  return sendSuccess(
    res,
    { present: Boolean(code) ? true : false, code: code ?? null },
    200
  );
});
