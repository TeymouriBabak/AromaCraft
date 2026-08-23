import 'dotenv/config';
import 'tsconfig-paths/register';

import { handleSignup } from '../src/lib/auth-utils';
import { initRedis, resetRateLimit } from '../src/lib/redis';

function makeMockRes() {
  let statusCode = 200;
  let body: unknown = null;
  const headers: Record<string, string | string[] | undefined> = {};
  return {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(obj: unknown) {
      body = obj;
      return { statusCode, body };
    },
    setHeader(name: string, value: string | string[]) {
      headers[name] = value;
      return this;
    },
    getHeader(name: string) {
      return headers[name];
    },
    _get() {
      return { statusCode, body, headers };
    },
  } as any;
}

async function main() {
  process.env.REDIS_URL = 'redis://redis:6379';
  await initRedis();
  await resetRateLimit('signup:203.0.113.99').catch(() => null);

  const email = `signup-rl-${Date.now()}@example.com`;
  const username = `SignupRate${Date.now()}`;

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const res = makeMockRes();
    const req = {
      method: 'POST',
      headers: { 'x-forwarded-for': '203.0.113.99' },
      body: {
        firstName: 'Signup',
        lastName: 'Tester',
        gender: 'Female',
        username: `${username}_${attempt}`,
        mobile: `+1415555${String(7000 + attempt).padStart(4, '0')}`,
        email,
        password: 'SignupPass!23',
        confirmPassword: 'SignupPass!23',
      },
    } as any;
    // compute ip the same way handler does (approx)
    const rawIp =
      (req as any).headers && (req as any).headers['x-forwarded-for'];
    const ip =
      typeof rawIp === 'string'
        ? rawIp
        : Array.isArray(rawIp)
          ? rawIp[0]
          : (req as any).socket?.remoteAddress || 'unknown';
    console.log('Computed signup key:', `signup:${ip}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (handleSignup as any)(req, res);
    const out = res._get();
    console.log('Attempt', attempt, 'status', out.statusCode, 'body', out.body);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
