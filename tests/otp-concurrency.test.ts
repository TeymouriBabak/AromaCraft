import 'dotenv/config';
import 'tsconfig-paths/register';

import { test } from 'vitest';
import assert from 'node:assert/strict';
import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import { createDbUser } from '../src/lib/db-auth';
import { prisma } from '../src/lib/prisma';
import { handleVerifyAccount } from '../src/lib/auth-utils';
import { hashOtp } from '../src/lib/auth/otp';

function makeMockRes() {
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
    setHeader() {
      return this;
    },
    _get() {
      return { statusCode, body };
    },
  } as unknown as {
    status(code: number): unknown;
    json(obj: unknown): { statusCode: number; body: unknown };
    _get(): { statusCode: number; body: unknown };
  };
}

test('concurrent OTP verification: only one attempt succeeds', async () => {
  const email = `otp-concurrent-${Date.now()}@example.com`;
  const user = await createDbUser({
    username: `otpcon${randomUUID().slice(0, 8)}`,
    email,
    password: 'OtpRace!23',
    role: 'customer',
    firstName: 'Otp',
    lastName: 'Race',
    gender: 'Other',
    mobile: `+1415${String(Date.now() % 100000).padStart(5, '0')}`,
    countryCode: '+1',
  });
  if (!user) throw new Error('failed to create test user');

  const code = '654321';
  const tokenId = randomUUID();
  await prisma.verificationToken.create({
    data: {
      id: tokenId,
      userId: user.id,
      type: 'EMAIL_VERIFICATION',
      token: randomUUID(),
      otpHash: await hashOtp(code),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      createdAt: new Date(),
      verified: false,
      usedCount: 0,
      attemptCount: 0,
    },
  });

  const reqFactory = () =>
    ({ method: 'POST', body: { email, code } }) as unknown as NextApiRequest;

  const r1 = makeMockRes();
  const r2 = makeMockRes();

  await Promise.all([
    (async () => {
      await handleVerifyAccount(reqFactory(), r1 as unknown as NextApiResponse);
    })(),
    (async () => {
      await handleVerifyAccount(reqFactory(), r2 as unknown as NextApiResponse);
    })(),
  ]);

  const out1 = r1._get();
  const out2 = r2._get();

  const successCount =
    Number(out1.statusCode === 200) + Number(out2.statusCode === 200);
  assert.equal(successCount, 1, 'Expected exactly one successful verification');

  // Subsequent attempts must fail
  const replayRes = makeMockRes();
  await handleVerifyAccount(
    { method: 'POST', body: { email, code } } as unknown as NextApiRequest,
    replayRes as unknown as NextApiResponse
  );
  assert.equal(replayRes._get().statusCode, 401);
});
