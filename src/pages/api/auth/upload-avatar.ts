import type { NextApiRequest, NextApiResponse } from 'next';
import { validateMethod, jsonError, jsonSuccess, parseJsonBody } from '@/lib/api-utils';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

  const body = parseJsonBody<{ imageDataUrl?: string }>(req);
  if (!body || !body.imageDataUrl) return jsonError(res, 'invalid_request', 'Image data is required.', 400);

  const match = body.imageDataUrl.match(/^data:(image\/(png|jpeg|jpg));base64,(.+)$/);
  if (!match) return jsonError(res, 'invalid_request', 'Invalid image data URL.', 400);

  const mime = match[1];
  const ext = match[2] === 'png' ? 'png' : 'jpg';
  const b64 = match[3];
  const buffer = Buffer.from(b64, 'base64');

  try {
    const useS3 = process.env.AVATAR_STORAGE === 's3';
    if (useS3) {
      const bucket = process.env.AVATAR_S3_BUCKET;
      const region = process.env.AVATAR_S3_REGION;
      if (!bucket || !region) return jsonError(res, 'invalid_request', 'S3 bucket/region not configured.', 500);
      const client = new S3Client({ region });
      const key = `avatars/${randomUUID()}.${ext}`;
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: mime }));
      const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
      return jsonSuccess(res, { url: publicUrl }, 201);
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    const filename = `${randomUUID()}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, buffer);
    const publicUrl = `/uploads/${filename}`;
    return jsonSuccess(res, { url: publicUrl }, 201);
  } catch (err) {
    return jsonError(res, 'server_error', 'Unable to store avatar image.', 500);
  }
}
