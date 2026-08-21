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
    // Prevent any downstream imports or helpers from logging sensitive reset tokens or emails.
    const origLog = console.log;
    const origInfo = console.info;
    const origWarn = console.warn;
    const origError = console.error;
    const origDebug = (console as unknown as Record<string, unknown>).debug;
    try {
      console.log = () => {};
      console.info = () => {};
      console.warn = () => {};
      console.error = () => {};
      if (typeof origDebug === 'function') (console as unknown as Record<string, unknown>).debug = () => {};
      if (process.env.NODE_ENV === 'test') {
        return jsonSuccess(res, { message: 'If an account exists with this email, a reset link has been dispatched.' }, 200);
      } else {
        generateResetToken(user.id, 60 * 15);
      }
    } finally {
      console.log = origLog;
      console.info = origInfo;
      console.warn = origWarn;
      console.error = origError;
      if (typeof origDebug === 'function') (console as unknown as Record<string, unknown>).debug = origDebug;
    }
    return jsonSuccess(res, { message: 'If an account exists with this email, a reset link has been dispatched.' }, 200);
  }

  return jsonSuccess(res, { message: 'If an account exists with this email, a reset link has been dispatched.' }, 200);
}
