import 'dotenv/config';
import 'tsconfig-paths/register';

import { test } from 'vitest';
import assert from 'node:assert/strict';

import handler from '../src/pages/api/dev/latest-verification-code';

function makeMockReq(body: unknown = {}) {
  return { method: 'POST', body } as unknown as import('next').NextApiRequest;
}

function makeMockRes() {
  let statusCode = 200;
  let body: unknown = null;
  const res = {
    status(code: number) {
      statusCode = code;
      return this as unknown as import('next').NextApiResponse;
    },
    json(obj: unknown) {
      body = obj;
      return { statusCode, body };
    },
    _get() {
      return { statusCode, body };
    },
  };
  return res as unknown as import('next').NextApiResponse & {
    _get(): { statusCode: number; body: unknown };
  };
}

test('dev latest-verification-code is inaccessible in production-like config', async () => {
  const origNodeEnv = process.env.NODE_ENV;
  const origEnable = process.env.ENABLE_DEV_OTP_ENDPOINT;
  try {
    const env = process.env as unknown as Record<string, string | undefined>;
    env.NODE_ENV = 'production';
    delete env.ENABLE_DEV_OTP_ENDPOINT;

    const req = makeMockReq({ email: 'test@example.com' });
    const res = makeMockRes();
    await (
      handler as unknown as (
        req: import('next').NextApiRequest,
        res: import('next').NextApiResponse
      ) => Promise<void>
    )(req, res);
    const out = res._get();
    assert.equal(out.statusCode, 404);
    const body = out.body as { success: boolean; error?: { code?: string } };
    assert.equal(body.success, false);
    assert.equal(body.error?.code, 'not_found');
  } finally {
    const env = process.env as unknown as Record<string, string | undefined>;
    env.NODE_ENV = origNodeEnv;
    if (origEnable === undefined) delete env.ENABLE_DEV_OTP_ENDPOINT;
    else env.ENABLE_DEV_OTP_ENDPOINT = origEnable;
  }
});
