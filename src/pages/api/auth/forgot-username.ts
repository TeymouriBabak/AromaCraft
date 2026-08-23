import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonError, jsonSuccess, validateMethod } from '@/lib/api-utils';
import { findUserByEmail } from '@/lib/mock-auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

  const { email } = req.body || {};
  if (!email || typeof email !== 'string') {
    return jsonError(res, 'invalid_request', 'Invalid email address.', 400);
  }

  const user = findUserByEmail(email);
  if (user) {
    // Security: Username recovery should send via email/SMS, not log to console
    if (process.env.NODE_ENV === 'development') {
      if (
        process.env.USE_MOCKS === 'true' &&
        process.env.NODE_ENV === 'development'
      ) {
        console.info(`[DEV] Username recovery request for ${user.email}`);
      }
    }
  }

  return jsonSuccess(
    res,
    {
      message:
        'If an account exists with this email, username recovery instructions have been sent.',
    },
    200
  );
}
