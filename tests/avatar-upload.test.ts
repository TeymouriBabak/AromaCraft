import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { NextApiRequest, NextApiResponse } from 'next';

import handler from '../src/pages/api/auth/upload-avatar';
import { getStorageProvider } from '../src/lib/providers/factory';
import { localStorageProvider } from '../src/lib/providers/implementations/storageLocal';
import { createDbSession, createDbUser } from '../src/lib/db-auth';

interface MockRes {
  status(code: number): MockRes;
  json(obj: unknown): { statusCode: number; body: unknown };
  _get(): { statusCode: number; body: unknown };
}

function makeMockRes(): MockRes {
  let statusCode = 200;
  let body: unknown = null;
  return {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(obj: unknown) {
      body = obj;
      return { statusCode, body };
    },
    _get() {
      return { statusCode, body };
    },
  } as MockRes;
}

function makeMultipartReq(file: Buffer, mimeType: string, filename: string, fieldName = 'avatar') {
  const boundary = '----test-boundary';
  const body = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"`,
    `Content-Type: ${mimeType}`,
    '',
    file.toString('binary'),
    `--${boundary}--`,
    '',
  ].join('\r\n');

  return {
    method: 'POST',
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
    },
    async *[Symbol.asyncIterator]() {
      yield Buffer.from(body, 'binary');
    },
  } as unknown as NextApiRequest;
}

function makeJsonReq(payload: Record<string, unknown>): NextApiRequest {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: payload,
  } as unknown as NextApiRequest;
}

async function makeAuthenticatedReq(req: NextApiRequest) {
  const user = await createDbUser({
    username: `avatar_${randomUUID().slice(0, 8)}`,
    email: `avatar_${randomUUID().slice(0, 8)}@example.com`,
    password: 'AvatarPass!23',
    role: 'customer',
    firstName: 'Avatar',
    lastName: 'Tester',
    gender: 'Female',
    mobile: `+1415555${String(Date.now() % 100000).padStart(5, '0')}`,
    countryCode: '+1',
  });

  if (!user) {
    throw new Error('Expected avatar test user to exist');
  }

  const session = await createDbSession(user.id, 3600);
  return {
    req: {
      ...req,
      headers: {
        ...(req.headers ?? {}),
        cookie: `aromacraft_sid=${session.token}`,
      },
    } as NextApiRequest,
    user,
  };
}

test('unauthenticated avatar upload is rejected with 401', async () => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAF', 'base64');
  const req = makeMultipartReq(png, 'image/png', 'avatar.png');
  const res = makeMockRes();

  await handler(req, res as unknown as NextApiResponse);
  assert.equal(res._get().statusCode, 401);
});

test('multipart PNG avatar upload succeeds and returns safe public URL', async () => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAF', 'base64');
  const req = makeMultipartReq(png, 'image/png', 'avatar.png');
  const { req: authenticatedReq } = await makeAuthenticatedReq(req);
  const res = makeMockRes();

  await handler(authenticatedReq, res as unknown as NextApiResponse);
  const out = res._get();
  const body = out.body as Record<string, unknown>;
  const data = body.data as Record<string, unknown>;

  assert.equal(body.ok, true);
  assert.equal(out.statusCode, 201);
  assert.equal(typeof data.url, 'string');
  assert.equal((data.url as string).startsWith('/uploads/'), true);
  assert.equal((data.url as string).includes('data:image'), false);
});

test('JSON data URL avatar upload is rejected with 400', async () => {
  const req = makeJsonReq({ imageDataUrl: 'data:image/png;base64,AAAA' });
  const { req: authenticatedReq } = await makeAuthenticatedReq(req);
  const res = makeMockRes();

  await handler(authenticatedReq, res as unknown as NextApiResponse);
  const out = res._get();
  assert.equal(out.statusCode, 400);
});

test('missing avatar field is rejected with 400', async () => {
  const boundary = '----missing-boundary';
  const body = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="other"',
    '',
    'value',
    `--${boundary}--`,
    '',
  ].join('\r\n');

  const req = {
    method: 'POST',
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    async *[Symbol.asyncIterator]() {
      yield Buffer.from(body, 'binary');
    },
  } as unknown as NextApiRequest;
  const { req: authenticatedReq } = await makeAuthenticatedReq(req);
  const res = makeMockRes();

  await handler(authenticatedReq, res as unknown as NextApiResponse);
  const out = res._get();
  assert.equal(out.statusCode, 400);
});

test('unsupported MIME type is rejected with 400', async () => {
  const gif = Buffer.from('R0lGODlhAQABAAAAACw=', 'base64');
  const req = makeMultipartReq(gif, 'image/gif', 'avatar.gif');
  const { req: authenticatedReq } = await makeAuthenticatedReq(req);
  const res = makeMockRes();

  await handler(authenticatedReq, res as unknown as NextApiResponse);
  assert.equal(res._get().statusCode, 400);
});

test('oversized avatar is rejected with 400', async () => {
  const big = Buffer.alloc(5 * 1024 * 1024 + 1);
  const req = makeMultipartReq(big, 'image/jpeg', 'avatar.jpg');
  const { req: authenticatedReq } = await makeAuthenticatedReq(req);
  const res = makeMockRes();

  await handler(authenticatedReq, res as unknown as NextApiResponse);
  assert.equal(res._get().statusCode, 400);
});

test('client code no longer uses readAsDataURL or imageDataUrl for avatar upload', () => {
  const source = readFileSync(join(process.cwd(), 'src/components/secure-auth-form.tsx'), 'utf8');
  assert.equal(source.includes('readAsDataURL'), false);
  assert.equal(source.includes('imageDataUrl'), false);
  assert.equal(source.includes('data:image'), false);
});

test('canonical storage provider resolves to local_files implementation', () => {
  const provider = getStorageProvider('local_files');
  assert.equal(provider, localStorageProvider);
});

test('safe relative paths are preserved under /uploads with subdirectories', async () => {
  const filePath = 'avatars/test.png';
  const result = await localStorageProvider.saveFile(filePath, Buffer.from('ok'), 'image/png');
  assert.equal(result, '/uploads/avatars/test.png');
  const absolutePath = join(process.cwd(), 'public/uploads/avatars/test.png');
  assert.equal(existsSync(absolutePath), true);
  rmSync(absolutePath, { force: true });
});

test('traversal and absolute storage paths are rejected', async () => {
  await assert.rejects(async () => {
    await localStorageProvider.saveFile('../escape.png', Buffer.from('nope'), 'image/png');
  });
  await assert.rejects(async () => {
    await localStorageProvider.saveFile('../../escape.png', Buffer.from('nope'), 'image/png');
  });
  await assert.rejects(async () => {
    await localStorageProvider.saveFile('/tmp/escape.png', Buffer.from('nope'), 'image/png');
  });
});
