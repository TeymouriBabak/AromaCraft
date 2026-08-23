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

test('wrong OTP attempts exhaust the attempt limit', async () => {
  const email = `otp-attempts-${Date.now()}@example.com`;
  const user = await createDbUser({
    username: `otpattempt${randomUUID().slice(0, 8)}`,
    email,
    password: 'AttemptsOtp!23',
    role: 'customer',
    firstName: 'Otp',
    lastName: 'Attempts',
    gender: 'Other',
    mobile: `+1415${String(Date.now() % 100000).padStart(5, '0')}`,
    countryCode: '+1',
  });
  if (!user) throw new Error('failed to create test user');

  const correct = '222333';
  const tokenId = randomUUID();
  await prisma.verificationToken.create({
    data: {
      id: tokenId,
      userId: user.id,
      type: 'EMAIL_VERIFICATION',
      token: randomUUID(),
      otpHash: await hashOtp(correct),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      createdAt: new Date(),
      verified: false,
      usedCount: 0,
      attemptCount: 4,
    },
  });

  // Submit a wrong code to increment attemptCount to 5 and ensure subsequent rejection
  const wrongRes = makeMockRes();
  await handleVerifyAccount(
    {
      method: 'POST',
      body: { email, code: '000000' },
    } as unknown as NextApiRequest,
    wrongRes as unknown as NextApiResponse
  );
  assert.equal(wrongRes._get().statusCode, 401);

  // Confirm attemptCount is now >=5
  const row = await prisma.verificationToken.findUnique({
    where: { id: tokenId },
  });
  assert.ok(row && (row.attemptCount ?? 0) >= 5);

  // Now even the correct code must be rejected
  const goodRes = makeMockRes();
  await handleVerifyAccount(
    {
      method: 'POST',
      body: { email, code: correct },
    } as unknown as NextApiRequest,
    goodRes as unknown as NextApiResponse
  );
  assert.equal(goodRes._get().statusCode, 401);
});
