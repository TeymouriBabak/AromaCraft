import {
  getEmailProvider,
  getSmsProvider,
  getStorageProvider,
} from '../src/lib/providers/factory';
import { mailpitProvider } from '../src/lib/providers/implementations/emailMailpit';
import { mockSmsProvider } from '../src/lib/providers/implementations/smsMock';
import { localStorageProvider } from '../src/lib/providers/implementations/storageLocal';

const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:3000';
const TIMESTAMP = Date.now();
const EMAIL = `test-${TIMESTAMP}@example.com`;
const USERNAME = `TestUser${Math.random().toString().slice(2, 8)}`;

function getSafeKeyPaths(obj: unknown, prefix = '', depth = 0): string[] {
  if (depth > 5 || !obj || typeof obj !== 'object') return [];
  if (Array.isArray(obj)) return [];

  const paths: string[] = [];
  const objRecord = obj as Record<string, unknown>;
  for (const key of Object.keys(objRecord)) {
    const path = prefix ? `${prefix}.${key}` : key;
    paths.push(path);
    const nested = getSafeKeyPaths(objRecord[key], path, depth + 1);
    paths.push(...nested);
  }
  return paths;
}

function ensureNoSecretPayload(
  payload: unknown,
  endpoint: string,
  allowDevSecret = false
) {
  if (allowDevSecret) {
    return;
  }

  // OTP-related fields that should never appear in normal responses
  const otpFields = [
    'otp',
    'otpCode',
    'verificationCode',
    'verificationToken',
    'otpHash',
    'code',
  ];
  // Sensitive fields
  const sensitiveFields = [
    'passwordHash',
    'password',
    'token',
    'session',
    'secret',
    'authorization',
    'cookie',
    'sessionToken',
  ];

  const allPaths = getSafeKeyPaths(payload);

  for (const path of allPaths) {
    const parts = path.split('.');
    const lastKey = parts[parts.length - 1];

    // Allow error.code as it's typically an error identifier, not an OTP
    if (path === 'error.code' || path === 'error.message') {
      continue;
    }

    // Check if OTP or sensitive field appears in data/user/meta sections (unsafe zones)
    const isInDataSection =
      path.startsWith('data.') ||
      path.startsWith('user.') ||
      path.startsWith('meta.');

    if (otpFields.includes(lastKey) && isInDataSection) {
      throw new Error(
        `OTP field ${lastKey} (path: ${path}) exposed in ${endpoint}`
      );
    }

    if (sensitiveFields.includes(lastKey)) {
      throw new Error(
        `Sensitive field ${lastKey} (path: ${path}) exposed in ${endpoint}`
      );
    }
  }
}

function logResponseStructure(
  res: { status: number; json: unknown },
  endpoint: string
) {
  const keys = getSafeKeyPaths(res.json);
  console.log(
    `RESPONSE_KEYS[${endpoint}]`,
    `status=${res.status}`,
    `keys=[${keys.slice(0, 10).join(', ')}${keys.length > 10 ? '...' : ''}]`
  );
}

async function post(path: string, body: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, json };
}

async function get(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { method: 'GET' });
  const json = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, json };
}

async function run() {
  console.log('START_SMOKE_TEST');

  const authProviders = {
    email: getEmailProvider(),
    sms: getSmsProvider(),
    storage: getStorageProvider(),
    env: {
      EMAIL_PROVIDER: process.env.EMAIL_PROVIDER ?? null,
      SMS_PROVIDER: process.env.SMS_PROVIDER ?? null,
      STORAGE_PROVIDER: process.env.STORAGE_PROVIDER ?? null,
    },
    resolved: {
      email:
        getEmailProvider() === mailpitProvider ? 'local_mailpit' : 'unknown',
      sms: getSmsProvider() === mockSmsProvider ? 'mock_sms' : 'unknown',
      storage:
        getStorageProvider() === localStorageProvider
          ? 'local_files'
          : 'unknown',
    },
  };

  // 0. Signup: create a user account first
  const signup = await post('/api/auth/signup', {
    firstName: 'Test',
    lastName: 'User',
    gender: 'Other',
    username: USERNAME,
    mobile: '+1 (555) 123-4567',
    email: EMAIL,
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!',
  });
  logResponseStructure(signup, '/api/auth/signup');
  ensureNoSecretPayload(signup.json, '/api/auth/signup');
  if (!signup.ok) {
    console.log('SIGNUP_ERROR', signup.json?.error?.message || 'unknown error');
    throw new Error(
      `Signup failed: ${signup.json?.error?.message || 'unknown error'}`
    );
  }
  console.log('SIGNUP', signup.status, signup.ok ? 'user_created' : 'failed');

  // 1. Resend verification
  const resend = await post('/api/auth/resend-verification', { email: EMAIL });
  logResponseStructure(resend, '/api/auth/resend-verification');
  ensureNoSecretPayload(resend.json, '/api/auth/resend-verification');
  console.log('RESEND', resend.status, resend.ok ? 'code_sent' : 'failed');

  // internal mock code retrieval from server-side dev endpoint
  const latest = await post('/api/dev/latest-verification-code', {
    email: EMAIL,
  });
  logResponseStructure(latest, '/api/dev/latest-verification-code');
  ensureNoSecretPayload(latest.json, '/api/dev/latest-verification-code', true);
  const code = latest.json.data?.code;
  console.log('INTERNAL_MOCK_CODE_FOUND', code ? 'yes' : 'no');
  if (!code) throw new Error('No mock verification code available');

  // 2. Verify the account successfully
  const verify = await post('/api/auth/verify-account', { email: EMAIL, code });
  logResponseStructure(verify, '/api/auth/verify-account');
  ensureNoSecretPayload(verify.json, '/api/auth/verify-account');
  console.log('VERIFY', verify.status, verify.ok ? 'verified' : 'failed');

  // 3. Confirm verified state persisted
  const me = await get('/api/auth/me');
  logResponseStructure(me, '/api/auth/me');
  console.log(
    'ME',
    me.status,
    me.json?.authenticated ? 'authenticated' : 'unauthenticated',
    me.json?.user?.emailVerified ? 'verified' : 'unverified'
  );

  // 4. Reuse same OTP should be rejected
  const reuse = await post('/api/auth/verify-account', { email: EMAIL, code });
  logResponseStructure(reuse, '/api/auth/verify-account (reuse)');
  ensureNoSecretPayload(reuse.json, '/api/auth/verify-account (reuse)');
  console.log(
    'REUSE',
    reuse.status,
    reuse.ok ? 'unexpected_allowed' : 'rejected_correct'
  );

  // 5. Request another code, old code should not work
  const resend2 = await post('/api/auth/resend-verification', { email: EMAIL });
  logResponseStructure(resend2, '/api/auth/resend-verification (second)');
  ensureNoSecretPayload(resend2.json, '/api/auth/resend-verification (second)');
  console.log('RESEND2', resend2.status, resend2.ok ? 'code_sent' : 'failed');

  const latest2 = await post('/api/dev/latest-verification-code', {
    email: EMAIL,
  });
  logResponseStructure(latest2, '/api/dev/latest-verification-code (second)');
  ensureNoSecretPayload(
    latest2.json,
    '/api/dev/latest-verification-code (second)',
    true
  );
  const code2 = latest2.json.data?.code;
  console.log('NEW_CODE_PRESENT', code2 ? 'yes' : 'no');
  if (!code2) throw new Error('Second mock verification code not found');
  console.log('CODE_ROTATED', code2 !== code ? 'yes' : 'no');

  const oldAfterRotate = await post('/api/auth/verify-account', {
    email: EMAIL,
    code,
  });
  logResponseStructure(
    oldAfterRotate,
    '/api/auth/verify-account (old after rotate)'
  );
  ensureNoSecretPayload(
    oldAfterRotate.json,
    '/api/auth/verify-account (old after rotate)'
  );
  console.log(
    'REUSE_OLD_AFTER_ROTATE',
    oldAfterRotate.status,
    oldAfterRotate.ok ? 'unexpected_allowed' : 'rejected_correct'
  );

  // 6. Rate limit: OTP resend limit
  const rate1 = await post('/api/auth/resend-verification', { email: EMAIL });
  const rate2 = await post('/api/auth/resend-verification', { email: EMAIL });
  const rate3 = await post('/api/auth/resend-verification', { email: EMAIL });
  ensureNoSecretPayload(rate1.json, '/api/auth/resend-verification (rate1)');
  ensureNoSecretPayload(rate2.json, '/api/auth/resend-verification (rate2)');
  ensureNoSecretPayload(rate3.json, '/api/auth/resend-verification (rate3)');
  console.log(
    'RATE1',
    rate1.status,
    rate1.ok ? 'allowed' : rate1.json?.error?.code || 'blocked'
  );
  console.log(
    'RATE2',
    rate2.status,
    rate2.ok ? 'allowed' : rate2.json?.error?.code || 'blocked'
  );
  console.log(
    'RATE3',
    rate3.status,
    rate3.ok ? 'allowed' : rate3.json?.error?.code || 'blocked'
  );

  const rate4 = await post('/api/auth/resend-verification', { email: EMAIL });
  console.log(
    'RATE4',
    rate4.status,
    rate4.ok ? 'allowed' : rate4.json?.error?.code || 'blocked'
  );

  console.log('PROVIDER_EMAIL', authProviders.resolved.email);
  console.log('PROVIDER_SMS', authProviders.resolved.sms);
  console.log('PROVIDER_STORAGE', authProviders.resolved.storage);
  console.log('DONE');
}

run().catch((err) => {
  console.error(
    'SMOKE_TEST_FAILED',
    err instanceof Error ? err.message : String(err)
  );
  process.exit(1);
});
