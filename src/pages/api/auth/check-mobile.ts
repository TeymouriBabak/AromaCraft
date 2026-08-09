import type { NextApiRequest, NextApiResponse } from 'next';
import { validateMethod, jsonError, jsonSuccess } from '@/lib/api-utils';
import { normalizePhoneNumber } from '@/lib/auth-validation';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const methodError = validateMethod(req, res, ['GET']);
  if (methodError) return methodError;

  const mobileRaw = String(req.query.mobile ?? '').trim();
  if (!mobileRaw) return jsonError(res, 'invalid_request', 'Mobile is required.', 400);

  try {
    const normalized = normalizePhoneNumber(mobileRaw);
    const user = await prisma.user.findFirst({ where: { mobile: normalized } }).catch(() => null);
    return jsonSuccess(res, { available: !Boolean(user) }, 200);
  } catch (err) {
    return jsonError(res, 'server_error', 'Unable to check mobile availability.', 500);
  }
}
