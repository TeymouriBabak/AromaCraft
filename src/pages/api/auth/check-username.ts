import type { NextApiRequest, NextApiResponse } from 'next';
import { validateMethod, jsonError, jsonSuccess } from '@/lib/api-utils';
import { findUserByUsername as findDbUserByUsername } from '@/lib/db-auth';
import { findUserByUsername as findMockUserByUsername } from '@/lib/mock-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const methodError = validateMethod(req, res, ['GET']);
  if (methodError) return methodError;

  const username = String(req.query.username ?? '').trim();
  if (!username)
    return jsonError(res, 'invalid_request', 'Username is required.', 400);

  try {
    const dbUser = await findDbUserByUsername(username).catch(() => null);
    const mockUser = findMockUserByUsername(username);
    const exists = Boolean(dbUser) || Boolean(mockUser);
    return jsonSuccess(res, { available: !exists }, 200);
  } catch {
    return jsonError(
      res,
      'server_error',
      'Unable to check username availability.',
      500
    );
  }
}
