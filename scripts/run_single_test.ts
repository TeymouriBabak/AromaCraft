import 'dotenv/config';
import 'tsconfig-paths/register';

import assert from 'node:assert/strict';
import { randomUUID } from 'crypto';

import forgotPassword from '../src/pages/api/auth/forgot-password';
import {
  handleLogin,
  handleVerifyAccount,
  handleResendVerification,
} from '../src/lib/auth-utils';
import { createDbUser, createDbSession } from '../src/lib/db-auth';
import { prisma } from '../src/lib/prisma';

async function clearTestState() {
  try {
    if ((globalThis as any).__aromacraftMockVerificationStore)
      (globalThis as any).__aromacraftMockVerificationStore.clear();
    if ((globalThis as any).__aromacraftMockOtpByEmail)
      (globalThis as any).__aromacraftMockOtpByEmail.clear();
  } catch {
    // ignore
  }
  try {
    const { initRedis, resetRateLimit } = await import('../src/lib/redis');
    await initRedis();
    await resetRateLimit('fail-closed:test').catch(() => null);
  } catch {
    // ignore
  }
}

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

async function runForgotPassword() {
  await clearTestState();
  const email = 'tbabak@example.com';
  const req = { method: 'POST', body: { email } } as any;
  const res = makeMockRes();
  const captured: string[] = [];
  const original = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };
  try {
    const capture = (...args: unknown[]) => {
      captured.push(args.map((a) => String(a)).join(' '));
    };
    console.log = capture as any;
    console.info = capture as any;
    console.warn = capture as any;
    console.error = capture as any;

    await forgotPassword(req, res);
    const out = res._get();
    const body = out.body as Record<string, any>;
    const payload = body.data as Record<string, any>;
    const message = String(payload.message ?? '');

    assert.equal(body.ok, true);
    assert.equal(typeof message, 'string');
    assert.equal(message.includes(email), false);
    assert.equal(message.includes('token'), false);
    assert.equal(message.includes('reset-link'), false);
    assert.equal(message.includes('expired'), false);

    const consoleText = captured.join(' ');
    assert.equal(
      consoleText.includes(email),
      false,
      `Captured console contained email: ${consoleText}`
    );
    assert.equal(
      consoleText.toLowerCase().includes('token'),
      false,
      `Captured console contained token substring: ${consoleText}`
    );
    assert.equal(
      /reset[-_ ]?link|\/reset|\?.*token=|token=|expires|expiry/i.test(
        consoleText
      ),
      false,
      `Captured console contained reset link-like text: ${consoleText}`
    );

    console.log = original.log;
    console.info = original.info;
    console.warn = original.warn;
    console.error = original.error;
    console.log('forgot-password: OK');
  } catch (err) {
    console.log = original.log;
    console.info = original.info;
    console.warn = original.warn;
    console.error = original.error;
    console.error('forgot-password: FAIL');
    console.error(
      err && (err as Error).stack ? (err as Error).stack : String(err)
    );
    process.exitCode = 2;
  }
}

async function runLoginRate() {
  await clearTestState();
  const ip = '203.0.113.30';
  let lastStatus = 200;
  let lastBody: Record<string, unknown> | null = null;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const res = makeMockRes();
    await (handleLogin as any)(
      {
        method: 'POST',
        headers: { 'x-forwarded-for': ip },
        body: {
          identifier: process.env.TEST_CUSTOMER_EMAIL || 'tbabak@example.com',
          password: process.env.TEST_CUSTOMER_PASSWORD || 'Test-Password-123!',
          role: 'customer',
        },
      },
      res
    );
    const out = res._get();
    lastStatus = out.statusCode;
    lastBody = out.body as Record<string, unknown> | null;
  }
  try {
    assert.equal(lastStatus, 429);
    assert.equal((lastBody?.error as any)?.code, 'rate_limited');
    const errorMessage = String((lastBody?.error as any)?.message ?? '');
    assert.equal(errorMessage.includes('tbabak@example.com'), false);
    assert.equal(errorMessage.toLowerCase().includes('email'), false);
    console.log('login-rate: OK');
  } catch (err) {
    console.error('login-rate: FAIL');
    console.error(
      err && (err as Error).stack ? (err as Error).stack : String(err)
    );
    process.exitCode = 2;
  }
}

async function runSignupRate() {
  await clearTestState();
  const { resetRateLimit } = await import('../src/lib/redis');
  await resetRateLimit('signup:203.0.113.99');
  const email = `signup-rl-${Date.now()}@example.com`;
  const username = `SignupRate${Date.now()}`;
  let lastStatus = 200;
  let lastBody: Record<string, unknown> | null = null;
  const authMod = await import('../src/lib/auth-utils');
  const handleSignupFn = authMod.handleSignup ?? authMod.default?.handleSignup;
  if (typeof handleSignupFn !== 'function') {
    console.error('handleSignup not found');
    process.exitCode = 2;
    return;
  }
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const res = makeMockRes();
    await handleSignupFn(
      {
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
      },
      res
    );
    const out = res._get();
    lastStatus = out.statusCode;
    lastBody = out.body as Record<string, unknown> | null;
  }
  try {
    assert.equal(lastStatus, 429);
    assert.equal((lastBody?.error as any)?.code, 'rate_limited');
    console.log('signup-rate: OK');
  } catch (err) {
    console.error('signup-rate: FAIL');
    console.error(
      err && (err as Error).stack ? (err as Error).stack : String(err)
    );
    process.exitCode = 2;
  }
}

async function runOtpResend() {
  await clearTestState();
  const { resetRateLimit } = await import('../src/lib/redis');
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
    console.error('setup user failed');
    process.exitCode = 2;
    return;
  }
  const firstCode = '123456';
  const firstToken = randomUUID();
  const { hashOtp } = await import('../src/lib/auth/otp');
  const hashed = await hashOtp(firstCode);
  await prisma.verificationToken.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      type: 'EMAIL_VERIFICATION',
      token: firstToken,
      otpHash: hashed,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      createdAt: new Date(Date.now() - 5_000),
      verified: false,
      usedCount: 0,
      attemptCount: 0,
    },
  });

  const authMod = await import('../src/lib/auth-utils');
  const handleResendFn =
    authMod.handleResendVerification ??
    authMod.default?.handleResendVerification;
  const getLatestMockVerificationOtp =
    authMod.getLatestMockVerificationOtp ??
    authMod.default?.getLatestMockVerificationOtp;
  const handleVerifyFn =
    authMod.handleVerifyAccount ?? authMod.default?.handleVerifyAccount;
  if (
    typeof handleResendFn !== 'function' ||
    typeof getLatestMockVerificationOtp !== 'function' ||
    typeof handleVerifyFn !== 'function'
  ) {
    console.error('auth utils functions not available');
    process.exitCode = 2;
    return;
  }
  const resendRes = makeMockRes();
  await handleResendFn({ method: 'POST', body: { email } }, resendRes);
  if (resendRes._get().statusCode !== 200) {
    console.error('resend did not return 200');
    process.exitCode = 2;
    return;
  }
  const latestCode = getLatestMockVerificationOtp(email, 'EMAIL_VERIFICATION');
  try {
    if (!latestCode || latestCode === firstCode)
      throw new Error('latestCode invalid');
    const staleRow = await prisma.verificationToken.findFirst({
      where: { userId: user.id, token: firstToken },
    });
    if (!staleRow || staleRow.usedAt === null)
      throw new Error('staleRow not invalidated');

    const oldAttemptRes = makeMockRes();
    await handleVerifyFn(
      { method: 'POST', body: { email, code: firstCode } } as any,
      oldAttemptRes as any
    );
    if (oldAttemptRes._get().statusCode !== 401)
      throw new Error('old code accepted');

    const latestAttemptRes = makeMockRes();
    await handleVerifyFn(
      { method: 'POST', body: { email, code: latestCode } } as any,
      latestAttemptRes as any
    );
    if (latestAttemptRes._get().statusCode !== 200)
      throw new Error('latest code rejected');

    const replayRes = makeMockRes();
    await handleVerifyFn(
      { method: 'POST', body: { email, code: latestCode } } as any,
      replayRes as any
    );
    if (replayRes._get().statusCode !== 401) throw new Error('replay accepted');

    console.log('otp-resend: OK');
  } catch (err) {
    console.error('otp-resend: FAIL');
    console.error(
      err && (err as Error).stack ? (err as Error).stack : String(err)
    );
    process.exitCode = 2;
  }
}

async function main() {
  const t = process.env.TEST || '';
  if (t === 'forgot-password') await runForgotPassword();
  else if (t === 'login-rate') await runLoginRate();
  else if (t === 'signup-rate') await runSignupRate();
  else if (t === 'otp-resend') await runOtpResend();
  else {
    console.log(
      'Specify TEST env: forgot-password | login-rate | signup-rate | otp-resend'
    );
  }
}

main().catch((e) => {
  console.error(e.stack || e);
  process.exitCode = 2;
});
