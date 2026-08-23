import 'dotenv/config';
import 'tsconfig-paths/register';

import { randomUUID } from 'crypto';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/prisma';
import { createDbUser } from '../src/lib/db-auth';
import { hashOtp } from '../src/lib/auth/otp';
import {
  handleResendVerification,
  handleVerifyAccount,
  getLatestMockVerificationOtp,
} from '../src/lib/auth-utils';

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

async function run() {
  const email = `otp-debug-${Date.now()}@example.com`;
  const user = await createDbUser({
    username: `OtpDebug${Date.now()}`,
    email,
    password: 'OtpPass!23',
    role: 'customer',
    firstName: 'Opt',
    lastName: 'Tester',
    gender: 'Female',
    mobile: `+1415555${String(2000 + (Date.now() % 9000)).padStart(4, '0')}`,
    countryCode: '+1',
  });

  if (!user) throw new Error('Failed to create user');

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

  console.log('Inserted first token', firstToken);

  // Call resend
  const resendRes = makeMockRes();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (handleResendVerification as any)(
    { method: 'POST', body: { email } },
    resendRes
  );
  console.log('resend status', resendRes._get().statusCode);

  const latestCode = getLatestMockVerificationOtp(email, 'EMAIL_VERIFICATION');
  console.log('latestCode (mock store) =', latestCode);

  // Check DB rows for tokens
  const rows = await prisma.verificationToken.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  console.log(
    'DB verification rows:',
    rows.map((r) => ({
      id: r.id,
      token: r.token,
      usedAt: r.usedAt,
      expiresAt: r.expiresAt,
    }))
  );

  // Try old code
  const oldAttemptRes = makeMockRes();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (handleVerifyAccount as any)(
    { method: 'POST', body: { email, code: firstCode } },
    oldAttemptRes
  );
  console.log(
    'old code verify status',
    oldAttemptRes._get().statusCode,
    'body',
    oldAttemptRes._get().body
  );

  // Try latest code
  const latestAttemptRes = makeMockRes();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (handleVerifyAccount as any)(
    { method: 'POST', body: { email, code: latestCode } },
    latestAttemptRes
  );
  console.log(
    'latest code verify status',
    latestAttemptRes._get().statusCode,
    'body',
    latestAttemptRes._get().body
  );

  // Inspect token rows again
  const rowsAfter = await prisma.verificationToken.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  console.log(
    'DB verification rows after verify attempts:',
    rowsAfter.map((r) => ({
      id: r.id,
      token: r.token,
      usedAt: r.usedAt,
      expiresAt: r.expiresAt,
    }))
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
