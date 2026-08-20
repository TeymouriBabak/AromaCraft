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
    status(code: number) { statusCode = code; return this; },
    json(obj: unknown) { body = obj; return { statusCode, body }; },
    setHeader() { return this; },
    _get() { return { statusCode, body }; },
  } as unknown as { status(code: number): unknown; json(obj: unknown): { statusCode: number; body: unknown }; _get(): { statusCode: number; body: unknown } };
}

test('expired OTP is rejected', async () => {
  const email = `otp-expired-${Date.now()}@example.com`;
  const uname = `otpexpired${randomUUID().slice(0,8)}`;
  const mobile = `+1415${String(Date.now() % 100000).padStart(5,'0')}`;
  const user = await createDbUser({
    username: uname,
    email,
    password: 'ExpiredOtp!23',
    role: 'customer',
    firstName: 'Otp',
    lastName: 'Expired',
    gender: 'Other',
    mobile,
    countryCode: '+1',
  });
  if (!user) throw new Error('failed to create test user');

  const code = '111222';
  await prisma.verificationToken.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      type: 'EMAIL_VERIFICATION',
      token: randomUUID(),
      otpHash: await hashOtp(code),
      expiresAt: new Date(Date.now() - 60 * 1000), // already expired
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
      verified: false,
      usedCount: 0,
      attemptCount: 0,
    },
  });

  const res = makeMockRes();
  await handleVerifyAccount({ method: 'POST', body: { email, code } } as unknown as NextApiRequest, res as unknown as NextApiResponse);
  const out = res._get();
  assert.equal(out.statusCode, 401);
});
