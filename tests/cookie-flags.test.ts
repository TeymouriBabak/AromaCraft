import 'dotenv/config';
import 'tsconfig-paths/register';

import { test } from 'vitest';
import assert from 'node:assert/strict';
import type { NextApiResponse } from 'next';
import { setSessionCookie } from '../src/lib/auth-utils';

function makeMockRes() {
  const headers: Record<string, string | string[]> = {};
  const res = {
    setHeader(name: string, value: string | string[]) { headers[name] = value; },
    _get() { return headers; },
  };
  return res as unknown as NextApiResponse & { _get(): Record<string, string | string[]> };
}

test('session cookie includes Secure in production and HttpOnly always', async () => {
  const prev = process.env.NODE_ENV;
  const env = process.env as { [k: string]: string | undefined };
  env.NODE_ENV = 'production';
  try {
    const res = makeMockRes();
    await setSessionCookie(res, 'testtoken', 3600, { id: 'u_test', role: 'customer' });
    const headers = res._get();
    const set = headers['Set-Cookie'];
    const cookies = Array.isArray(set) ? set : [String(set)];
    const sessionCookie = cookies.find((c) => String(c).startsWith('aromacraft_sid='));
    if (!sessionCookie) throw new Error('session cookie not set');
    const sc = String(sessionCookie);
    assert.ok(sc.includes('HttpOnly'));
    assert.ok(sc.includes('Secure'));
    assert.ok(sc.includes('SameSite=Lax'));
    assert.ok(sc.includes('Path=/'));
  } finally {
    if (prev === undefined) delete env.NODE_ENV; else env.NODE_ENV = prev;
  }
});
