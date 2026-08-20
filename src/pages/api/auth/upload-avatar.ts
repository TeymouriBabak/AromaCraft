import type { NextApiRequest, NextApiResponse } from 'next';
import { validateMethod, jsonError, jsonSuccess } from '@/lib/api-utils';
import { randomUUID } from 'crypto';
import { getStorageProvider } from '@/lib/providers/factory';
import { parseSession } from '@/lib/auth-utils';
import { checkRateLimit, RATE_LIMIT_CONFIG } from '@/lib/redis';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

async function readMultipartForm(req: NextApiRequest): Promise<{ field: string; file: Buffer; mimeType: string; filename: string } | null> {
  const contentType = req.headers['content-type'] || '';
  const match = contentType.match(/boundary=(?:(?:"([^"]+)"|([^;]+)))/i);
  if (!match) return null;

  const boundary = match[1] || match[2];
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks);
  const boundaryMarker = Buffer.from(`--${boundary}`);
  const boundaryIndex = raw.indexOf(boundaryMarker);
  if (boundaryIndex < 0) return null;

  const headerStart = raw.indexOf(Buffer.from('Content-Disposition: form-data', 'utf8'), boundaryIndex);
  if (headerStart < 0) return null;

  const headerEnd = raw.indexOf(Buffer.from('\r\n\r\n'), headerStart);
  if (headerEnd < 0) return null;

  const headerText = raw.subarray(headerStart, headerEnd).toString('utf8');
  const fileMatch = headerText.match(/name="([^"]+)"/i);
  const filenameMatch = headerText.match(/filename="([^"]+)"/i);
  const mimeTypeMatch = headerText.match(/Content-Type:\s*([^\r\n]+)/i);
  if (!fileMatch || !filenameMatch || !mimeTypeMatch || fileMatch[1] !== 'avatar') return null;

  const bodyStart = headerEnd + 4;
  const tailMarker = Buffer.from(`\r\n--${boundary}`);
  const bodyEnd = raw.indexOf(tailMarker, bodyStart);
  const fileBytes = bodyEnd >= 0 ? raw.subarray(bodyStart, bodyEnd) : raw.subarray(bodyStart);

  return {
    field: fileMatch[1],
    file: Buffer.from(fileBytes),
    mimeType: mimeTypeMatch[1].trim(),
    filename: filenameMatch[1].replace(/[\\/]+/g, '_'),
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

  // Allow anonymous uploads for signup flows, but enforce rate limiting to prevent abuse.
  // Use parseSession (non-mutating) to detect if a session exists without sending a 401 response.
  const session = await parseSession(req).catch(() => null);
  if (!session) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const key = `upload-avatar:${String(ip)}`;
      const allowed = await checkRateLimit(key, RATE_LIMIT_CONFIG.SIGNUP.limit * 10, RATE_LIMIT_CONFIG.SIGNUP.windowSeconds).catch(() => true);
      if (!allowed) return jsonError(res, 'rate_limited', 'Too many avatar uploads. Try later.', 429);
    } catch {
      // If rate-limiter is unavailable, allow in dev but return 503 in production.
      if (process.env.NODE_ENV === 'production') {
        return jsonError(res, 'rate_limiter_unavailable', 'Rate limiting unavailable. Try again later.', 503);
      }
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[upload-avatar] Redis check unavailable, continuing in dev mode');
      }
    }
  }

  try {
    const part = await readMultipartForm(req);
    if (!part) return jsonError(res, 'invalid_request', 'Multipart avatar upload is required.', 400);

    const { file, mimeType, filename } = part;
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return jsonError(res, 'invalid_request', 'Only PNG, JPEG, and WEBP avatars are allowed.', 400);
    }

    if (file.length > MAX_AVATAR_SIZE) {
      return jsonError(res, 'invalid_request', 'Avatar file size must not exceed 5MB.', 400);
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = safeName.includes('.') ? safeName.slice(safeName.lastIndexOf('.') + 1) : 'png';
    const provider = getStorageProvider();
    const storagePath = `avatars/${randomUUID()}.${ext}`;
    const publicUrl = await provider.saveFile(storagePath, file, mimeType);
    return jsonSuccess(res, { url: publicUrl }, 201);
  } catch {
    return jsonError(res, 'server_error', 'Unable to store avatar image.', 500);
  }
}


export const config = {
  api: { bodyParser: false },
};
