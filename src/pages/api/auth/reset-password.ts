import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonError, jsonSuccess, validateMethod } from '@/lib/api-utils';
import { validateResetToken, updateUserPassword } from '@/lib/mock-auth';

// Password rules -- must match registration form in secure-auth-form.tsx
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#^])[A-Za-z\d@$!%*?&_\-#^]{8,}$/;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

  const { token, password } = req.body || {};

  if (!token || typeof token !== 'string') {
    return jsonError(res, 'invalid_request', 'Reset token is missing.', 400);
  }

  if (!password || typeof password !== 'string') {
    return jsonError(res, 'invalid_request', 'New password is required.', 400);
  }

  if (!PASSWORD_REGEX.test(password)) {
    return jsonError(
      res,
      'weak_password',
      'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.',
      400
    );
  }

  const userId = validateResetToken(token);
  if (!userId) {
    return jsonError(
      res,
      'invalid_token',
      'This reset link is invalid or has expired.',
      400
    );
  }

  const updated = updateUserPassword(userId, password);
  if (!updated) {
    return jsonError(res, 'update_failed', 'Could not update password.', 500);
  }

  return jsonSuccess(res, { message: 'Password updated successfully.' }, 200);
}
