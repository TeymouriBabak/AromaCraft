import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonError, jsonSuccess, validateMethod } from '@/lib/api-utils';
import { findUserByEmail as findDbUserByEmail } from '@/lib/db-auth';
import { findUserByEmail as findMockUserByEmail } from '@/lib/mock-auth';
import { sendUsernameRecoveryEmail } from '@/lib/services/mailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

  const { email } = req.body || {};
  if (!email || typeof email !== 'string') {
    return jsonError(res, 'invalid_request', 'Invalid email address.', 400);
  }

  const user =
    (await findDbUserByEmail(email).catch(() => null)) ||
    findMockUserByEmail(email);
  if (user && process.env.NODE_ENV !== 'test') {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://127.0.0.1:3000';
    const loginUrl = `${appUrl}/login`;
    const sent = await sendUsernameRecoveryEmail(
      user.email,
      user.username,
      loginUrl
    );
    if (!sent) {
      console.error('[forgot-username] username recovery email failed');
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
