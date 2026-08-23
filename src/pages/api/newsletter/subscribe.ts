import type { NextApiRequest, NextApiResponse } from 'next';
import {
  addNewsletterSubscription,
  hasNewsletterSubscription,
} from '@/lib/newsletter-store';
import {
  jsonError,
  jsonSuccess,
  parseJsonBody,
  validateMethod,
} from '@/lib/api-utils';

function isValidEmail(value: unknown): value is string {
  return (
    typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  );
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

  const body = parseJsonBody<{ email?: unknown }>(req);
  if (!body || !isValidEmail(body.email)) {
    return jsonError(
      res,
      'invalid_request',
      'A valid email address is required.',
      400
    );
  }

  const normalizedEmail = body.email.trim().toLowerCase();

  if (hasNewsletterSubscription(normalizedEmail)) {
    return jsonError(
      res,
      'duplicate_email',
      'This email is already subscribed.',
      409
    );
  }

  addNewsletterSubscription(normalizedEmail);
  return jsonSuccess(
    res,
    {
      email: normalizedEmail,
      message: 'Successfully subscribed to the newsletter.',
    },
    201
  );
}
