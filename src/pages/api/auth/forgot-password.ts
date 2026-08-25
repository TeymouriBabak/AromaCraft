import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonError, jsonSuccess, validateMethod } from '@/lib/api-utils';
import { findUserByEmail, generateResetToken } from '@/lib/mock-auth';
import { sendPasswordResetEmail } from '@/lib/services/mailer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

  const { email } = req.body || {};
  if (!email || typeof email !== 'string') {
    return jsonError(res, 'invalid_request', 'Invalid email address.', 400);
  }

  const user = findUserByEmail(email);

  if (user && process.env.NODE_ENV !== 'test') {
    const token = generateResetToken(user.id, 60 * 15);
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? 'http://127.0.0.1:3000';
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(
      String(token)
    )}`;
    await sendPasswordResetEmail(user.email, resetUrl);
  }

  return jsonSuccess(
    res,
    {
      message:
        'If an account exists with this email, a reset link has been dispatched.',
    },
    200
  );
}
