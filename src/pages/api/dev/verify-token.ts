import type { NextApiRequest, NextApiResponse } from 'next';
import { devOnly } from '@/lib/middleware/devGuard';
import {
  sendSuccess,
  sendMethodNotAllowed,
  sendValidationError,
  sendNotFound,
} from '@/lib/api-response';
import { verifyResetToken } from '@/lib/mock-auth';

export default devOnly(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, ['POST']);
  }

  const { token } = req.body || {};
  if (!token || typeof token !== 'string') {
    return sendValidationError(res, 'Token is required and must be a string.');
  }

  const entry = verifyResetToken(token);
  if (!entry) {
    return sendNotFound(res, 'Reset token is invalid or expired.');
  }

  return sendSuccess(
    res,
    { valid: true, userId: entry.userId, expiresAt: entry.expiresAt },
    200
  );
});
