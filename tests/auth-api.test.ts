import test from 'node:test';
import assert from 'node:assert/strict';

import { randomUUID } from 'crypto';
import checkUsername from '../src/pages/api/auth/check-username';
import checkEmail from '../src/pages/api/auth/check-email';
import forgotPassword from '../src/pages/api/auth/forgot-password';
import { handleLogin, handleVerifyAccount, requireRole } from '../src/lib/auth-utils';
import { createDbSession, createDbUser } from '../src/lib/db-auth';
import { getSmsProvider } from '../src/lib/providers/factory';
import { hashOtp } from '../src/lib/auth/otp';
import { prisma } from '../src/lib/prisma';

interface MockRes {
  status(code: number): MockRes;
  json(obj: unknown): { statusCode: number; body: unknown };
  setHeader(name: string, value: string | string[]): MockRes;
  getHeader(name: string): string | string[] | undefined;
  _get(): { statusCode: number; body: unknown; headers: Record<string, string | string[] | undefined> };
}

async function prepareRedisRateLimitTest() {
  process.env.REDIS_URL = 'redis://redis:6379';
  const { initRedis, resetRateLimit } = await import('../src/lib/redis');
  await initRedis();
  return { resetRateLimit };
}

function makeMockRes(): MockRes {
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
  } as MockRes;
}

test('check-username returns taken for mock user', async () => {
  const req = { method: 'GET', query: { username: 'Tbabak' } } as unknown;
  const res = makeMockRes();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (checkUsername as any)(req, res);
  const out = res._get();
  assert.equal((out.body as Record<string, unknown>).ok, true);
  assert.equal(((out.body as Record<string, unknown>).data as Record<string, unknown>).available, false);
});

test('check-email returns taken for mock email', async () => {
  const req = { method: 'GET', query: { email: 'tbabak@example.com' } } as unknown;
  const res = makeMockRes();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (checkEmail as any)(req, res);
  const out = res._get();
  assert.equal((out.body as Record<string, unknown>).ok, true);
  assert.equal(((out.body as Record<string, unknown>).data as Record<string, unknown>).available, false);
});

test('forgot-password keeps the response generic and does not log sensitive reset data for an existing user', async () => {
  const email = 'tbabak@example.com';
  const req = { method: 'POST', body: { email } } as unknown;
  const res = makeMockRes();
  const originalLog = console.log;
  const originalInfo = console.info;
  const captured: string[] = [];

  try {
    const capture = (...args: unknown[]) => {
      captured.push(args.map((arg) => String(arg)).join(' '));
    };

    console.log = capture;
    console.info = capture;

    const { checkRateLimit } = await import('../src/lib/redis');
    assert.equal(await checkRateLimit('fail-closed:test', 1, 60), false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (forgotPassword as any)(req, res);
    const out = res._get();
    const body = out.body as Record<string, unknown>;
    const payload = body.data as Record<string, unknown>;
    const message = String(payload.message ?? '');

    assert.equal(body.ok, true);
    assert.equal(typeof message, 'string');
    assert.equal(message.includes(email), false);
    assert.equal(message.includes('token'), false);
    assert.equal(message.includes('reset-link'), false);
    assert.equal(message.includes('expired'), false);

    const consoleText = captured.join(' ');
    assert.equal(consoleText.includes(email), false);
    assert.equal(consoleText.toLowerCase().includes('token'), false);
    assert.equal(/reset[-_ ]?link|\/reset|\?.*token=|token=|expires|expiry/i.test(consoleText), false);
  } finally {
    console.log = originalLog;
    console.info = originalInfo;
  }
});

test('admin-only endpoints reject unauthenticated users and customer role access', async () => {
  const unauthRes = makeMockRes();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (requireRole as any)({ headers: {} }, unauthRes, ['admin']);
  assert.equal(unauthRes._get().statusCode, 401);

  const customerUser = await createDbUser({
    username: `customer_${randomUUID().slice(0, 8)}`,
    email: `customer_${randomUUID().slice(0, 8)}@example.com`,
    password: 'CustomerPass!23',
    role: 'customer',
    firstName: 'Test',
    lastName: 'Customer',
    gender: 'Female',
    mobile: `+1415555${String(Date.now() % 100000).padStart(5, '0')}`,
    countryCode: '+1',
  });
  assert.ok(customerUser);

  const customerSession = await createDbSession(customerUser.id, 3600);
  const customerReq = {
    method: 'GET',
    headers: { cookie: `aromacraft_sid=${customerSession.token}` },
  } as unknown as Parameters<typeof requireRole>[0];
  const customerRes = makeMockRes();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (requireRole as any)(customerReq, customerRes, ['admin']);
  assert.equal(customerRes._get().statusCode, 403);
});

test('production does not silently select a mock SMS provider', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousSmsProvider = process.env.SMS_PROVIDER;

  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'production',
    configurable: true,
    writable: true,
    enumerable: true,
  });

  try {
    Reflect.deleteProperty(process.env, 'SMS_PROVIDER');
    assert.throws(() => getSmsProvider(), /SMS_PROVIDER must be configured in production/);
  } finally {
    if (previousNodeEnv === undefined) {
      Reflect.deleteProperty(process.env, 'NODE_ENV');
    } else {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: previousNodeEnv,
        configurable: true,
        writable: true,
        enumerable: true,
      });
    }

    if (previousSmsProvider === undefined) {
      Reflect.deleteProperty(process.env, 'SMS_PROVIDER');
    } else {
      Object.defineProperty(process.env, 'SMS_PROVIDER', {
        value: previousSmsProvider,
        configurable: true,
        writable: true,
        enumerable: true,
      });
    }
  }
});

test('login rate limiting returns 429 after repeated attempts and does not leak the account identifier', async () => {
  const ip = '203.0.113.30';
  let lastStatus = 200;
  let lastBody: Record<string, unknown> | null = null;

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const res = makeMockRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (handleLogin as any)({
      method: 'POST',
      headers: { 'x-forwarded-for': ip },
      body: { identifier: 'tbabak@example.com', password: 'Teymouribabak78#', role: 'customer' },
    }, res);
    const out = res._get();
    lastStatus = out.statusCode;
    lastBody = out.body as Record<string, unknown> | null;
  }

  assert.equal(lastStatus, 429);
  assert.equal((lastBody?.error as Record<string, unknown> | undefined)?.code, 'rate_limited');
  const errorMessage = String((lastBody?.error as Record<string, unknown> | undefined)?.message ?? '');
  assert.equal(errorMessage.includes('tbabak@example.com'), false);
  assert.equal(errorMessage.toLowerCase().includes('email'), false);
});

test('signup enforces the canonical rate limit before account creation', async () => {
  const { resetRateLimit } = await prepareRedisRateLimitTest();
  await resetRateLimit('signup:203.0.113.99');

  const email = `signup-rl-${Date.now()}@example.com`;
  const username = `SignupRate${Date.now()}`;
  let lastStatus = 200;
  let lastBody: Record<string, unknown> | null = null;

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const res = makeMockRes();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await ((await import('../src/lib/auth-utils')).handleSignup as any)({
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
    }, res);
    const out = res._get();
    lastStatus = out.statusCode;
    lastBody = out.body as Record<string, unknown> | null;
  }

  assert.equal(lastStatus, 429);
  assert.equal((lastBody?.error as Record<string, unknown> | undefined)?.code, 'rate_limited');
});

test('OTP resend invalidates older valid codes and only the newest OTP succeeds', async () => {
  const { resetRateLimit } = await prepareRedisRateLimitTest();
  const email = `otp-${Date.now()}@example.com`;
  await resetRateLimit(`resend:${email}`);

  const user = await createDbUser({
    username: `Otp${Date.now()}`,
    email,
    password: 'OtpPass!23',
    role: 'customer',
    firstName: 'Opt',
    lastName: 'Tester',
    gender: 'Female',
    mobile: `+1415555${String(2000 + (Date.now() % 9000)).padStart(4, '0')}`,
    countryCode: '+1',
  });

  if (!user) {
    throw new Error('Expected OTP test user to exist');
  }

  const firstCode = '123456';
  const firstToken = randomUUID();
  await prisma.verificationToken.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      type: 'EMAIL_VERIFICATION',
      token: firstToken,
      otpHash: await hashOtp(firstCode),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      createdAt: new Date(Date.now() - 5_000),
      verified: false,
      usedCount: 0,
      attemptCount: 0,
    },
  });

  const resendRes = makeMockRes();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await ((await import('../src/lib/auth-utils')).handleResendVerification as any)({ method: 'POST', body: { email } }, resendRes);
  assert.equal(resendRes._get().statusCode, 200);

  const latestCode = (await import('../src/lib/auth-utils')).getLatestMockVerificationOtp(email, 'EMAIL_VERIFICATION');
  assert.ok(latestCode && latestCode !== firstCode);

  const staleRow = await prisma.verificationToken.findFirst({ where: { userId: user.id, token: firstToken } });
  assert.ok(staleRow && staleRow.usedAt !== null);

  const oldAttemptRes = makeMockRes();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (handleVerifyAccount as any)({ method: 'POST', body: { email, code: firstCode } }, oldAttemptRes);
  assert.equal(oldAttemptRes._get().statusCode, 401);

  const latestAttemptRes = makeMockRes();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (handleVerifyAccount as any)({ method: 'POST', body: { email, code: latestCode } }, latestAttemptRes);
  assert.equal(latestAttemptRes._get().statusCode, 200);

  const replayRes = makeMockRes();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (handleVerifyAccount as any)({ method: 'POST', body: { email, code: latestCode } }, replayRes);
  assert.equal(replayRes._get().statusCode, 401);
});
