import type { NextApiRequest, NextApiResponse } from 'next';
import { validateMethod, jsonError, jsonSuccess, parseJsonBody } from '@/lib/api-utils';
import { devOnly } from '@/lib/middleware/devGuard';
import { getSmsProvider } from '@/lib/providers/factory';

export default devOnly(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

  const body = parseJsonBody<{ phone?: string }>(req);
  if (!body || !body.phone) return jsonError(res, 'invalid_request', 'Phone is required.', 400);

  const provider = getSmsProvider();
  try {
    await provider.sendSms(body.phone, 'This is a developer test SMS from AromaCraft.');
    return jsonSuccess(res, { sent: true }, 200);
  } catch (err) {
    console.error('[test-sms] send failed', err instanceof Error ? err.message : err);
    return jsonError(res, 'sms_failed', 'Unable to send SMS.', 500);
  }
});
