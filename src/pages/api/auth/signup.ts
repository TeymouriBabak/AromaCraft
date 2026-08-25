import type { NextApiRequest, NextApiResponse } from 'next';
import { handleSignup } from '@/lib/auth-utils';
import { signupSchema } from '@/lib/validators/auth';
import { sendValidationError } from '@/lib/api-response';
import fs from 'fs';
import path from 'path';

function avatarFileExists(avatarUrl: string): boolean {
  const m =
    avatarUrl.match(
      /^\/api\/auth\/upload-avatar\?f=([a-f0-9-]+\.(?:jpe?g|png|webp))$/i
    ) ??
    avatarUrl.match(/^\/uploads\/avatars\/([a-f0-9-]+\.(?:jpe?g|png|webp))$/i);
  if (!m) return false;
  return fs.existsSync(
    path.join(process.cwd(), 'public', 'uploads', 'avatars', m[1])
  );
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST')
    return sendValidationError(res, 'Method not allowed');
  // validate inputs early with Zod
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    console.error('[signup] validation errors:', parsed.error.flatten());
    return sendValidationError(res, 'Invalid signup payload');
  }

  const { avatarUrl } = parsed.data;
  if (!avatarUrl || !avatarFileExists(avatarUrl)) {
    return sendValidationError(res, 'Avatar image is missing or invalid.');
  }

  return handleSignup(req, res);
}
