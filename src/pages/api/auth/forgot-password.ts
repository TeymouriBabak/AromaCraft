import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonError, jsonSuccess, validateMethod } from '@/lib/api-utils';
import { findUserByEmail, generateResetToken } from '@/lib/mock-auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

  const { email } = req.body || {};
  if (!email || typeof email !== 'string') {
    return jsonError(res, 'invalid_request', 'Invalid email address.', 400);
  }

  const user = findUserByEmail(email);
  if (user) {
    generateResetToken(user.id, 60 * 15);
    return jsonSuccess(res, { message: 'If an account exists with this email, a reset link has been dispatched.' }, 200);
  }

  return jsonSuccess(res, { message: 'If an account exists with this email, a reset link has been dispatched.' }, 200);
}
