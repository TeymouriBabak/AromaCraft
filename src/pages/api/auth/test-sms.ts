import type { NextApiRequest, NextApiResponse } from 'next';
import { validateMethod, jsonError, jsonSuccess, parseJsonBody } from '@/lib/api-utils';
import { sendVerificationSMS } from '@/lib/services/sms';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

  const body = parseJsonBody<{ phone?: string; code?: string }>(req);
  if (!body || !body.phone || !body.code) return jsonError(res, 'invalid_request', 'Phone and code required.', 400);

  const ok = await sendVerificationSMS(body.phone, body.code).catch(() => false);
  if (!ok) return jsonError(res, 'sms_failed', 'Unable to send SMS.', 500);
  return jsonSuccess(res, { sent: true }, 200);
}
