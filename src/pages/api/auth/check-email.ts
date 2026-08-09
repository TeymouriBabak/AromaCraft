import type { NextApiRequest, NextApiResponse } from 'next';
import { validateMethod, jsonError, jsonSuccess } from '@/lib/api-utils';
import { findUserByEmail as findDbUserByEmail } from '@/lib/db-auth';
import { findUserByEmail as findMockUserByEmail } from '@/lib/mock-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const methodError = validateMethod(req, res, ['GET']);
  if (methodError) return methodError;

  const email = String(req.query.email ?? '').trim().toLowerCase();
  if (!email) return jsonError(res, 'invalid_request', 'Email is required.', 400);

  try {
    const dbUser = await findDbUserByEmail(email).catch(() => null);
    const mockUser = findMockUserByEmail(email);
    const exists = Boolean(dbUser) || Boolean(mockUser);
    return jsonSuccess(res, { available: !exists }, 200);
  } catch (err) {
    return jsonError(res, 'server_error', 'Unable to check email availability.', 500);
  }
}
