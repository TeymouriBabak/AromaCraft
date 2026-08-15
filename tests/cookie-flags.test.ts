import test from 'node:test';
import assert from 'node:assert/strict';
import { setSessionCookie } from '../src/lib/auth-utils';

function makeMockRes() {
  let headers: Record<string, string | string[]> = {};
  return {
    setHeader(name: string, value: string | string[]) { headers[name] = value; },
    _get() { return headers; },
  } as unknown as { setHeader(name: string, value: string | string[]): void; _get(): Record<string, string | string[]> };
}

test('session cookie includes Secure in production and HttpOnly always', async () => {
  const prev = process.env.NODE_ENV;
  Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true, writable: true });
  try {
    const res = makeMockRes();
    setSessionCookie(res as any, 'testtoken', 3600, { id: 'u_test', role: 'customer' });
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
    if (prev === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = prev;
  }
});
