import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID, randomInt } from 'crypto';
import {
  findUserByEmail as findMockUserByEmail,
  findUserByUsername as findMockUserByUsername,
  findUserById as findMockUserById,
  Role,
  User,
} from './mock-auth';
import {
  jsonError,
  jsonSuccess,
  getCookieValue,
  validateMethod,
  parseJsonBody,
} from './api-utils';
import {
  authenticateCredentials as authenticateDbUser,
  createDbSession,
  createDbUser,
  deleteSessionByCookieValue,
  getSessionByCookieValue,
  findUserByEmail as findDbUserByEmail,
  findUserByUsername as findDbUserByUsername,
  findUserById as findDbUserById,
  revokeSessionsForUser,
  type DbUserRecord,
} from './db-auth';
import { Prisma } from '../generated/prisma/client';
import { prisma } from './prisma';
import { signRouteHint } from './route-auth';
import { isPhoneNumberValid, normalizePhoneNumber } from './auth-validation';
import { parsePhoneNumber } from 'libphonenumber-js/max';
import { sendVerificationEmail } from './services/mailer';
import { sendVerificationSMS } from './services/sms';

export const SESSION_COOKIE_NAME = 'aromacraft_sid';
export const ROUTE_HINT_COOKIE_NAME = 'aromacraft_route_hint';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type AuthPublicUser = {
  id: string;
  username: string;
  email: string;
  role: Role;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
  mobile?: string;
  countryCode?: string;
};

const VERIFICATION_TTL_MS = 15 * 60 * 1000;

// In-memory store for verification tokens created for mock users (development)
declare global {
  // allow these globals for dev/testing only
  var __aromacraftMockVerificationStore:
    | Map<
        string,
        Array<{
          id: string;
          token: string;
          otp?: string;
          otpHash?: string | null;
          type: string;
          createdAt: Date;
          expiresAt: Date;
          usedAt?: Date | null;
          attemptCount?: number;
          usedCount?: number;
        }>
      >
    | undefined;
  var __aromacraftMockOtpByEmail:
    Map<string, { type: string; otp: string; expiresAt: Date }> | undefined;
}

const mockVerificationStore =
  globalThis.__aromacraftMockVerificationStore ??
  new Map<
    string,
    Array<{
      id: string;
      token: string;
      otp?: string;
      otpHash?: string | null;
      type: string;
      createdAt: Date;
      expiresAt: Date;
      usedAt?: Date | null;
      attemptCount?: number;
      usedCount?: number;
    }>
  >();
if (!globalThis.__aromacraftMockVerificationStore)
  globalThis.__aromacraftMockVerificationStore = mockVerificationStore;

// In-memory store for development OTPs keyed by email (for easy test retrieval)
const mockOtpByEmail =
  globalThis.__aromacraftMockOtpByEmail ??
  new Map<string, { type: string; otp: string; expiresAt: Date }>();
if (!globalThis.__aromacraftMockOtpByEmail)
  globalThis.__aromacraftMockOtpByEmail = mockOtpByEmail;

export function getLatestMockVerificationOtp(
  email: string,
  type: 'EMAIL_VERIFICATION' | 'LOGIN_OTP' | 'PURCHASE_OTP'
) {
  const normalized = normalizeEmail(email);

  // First check email-keyed store (for development)
  const emailEntry = mockOtpByEmail.get(normalized);
  if (
    emailEntry &&
    emailEntry.type === type &&
    emailEntry.expiresAt.getTime() > Date.now()
  ) {
    return emailEntry.otp;
  }

  // Then check user-ID-keyed store (for in-memory mock users)
  const mockUser = findMockUserByEmail(normalized);
  if (mockUser) {
    const entries = mockVerificationStore.get(mockUser.id) ?? [];
    const candidate = entries.find(
      (entry) =>
        entry.type === type &&
        entry.expiresAt.getTime() > Date.now() &&
        !entry.usedAt
    );
    if (candidate?.otp) return candidate.otp;
  }

  return null;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function generateOtp() {
  // crypto.randomInt is cryptographically secure and uniformly distributed,
  // unlike Math.random(). The upper bound is exclusive, so the result is
  // always a 6-digit number in the range 100000..999999 (no padStart needed).
  return String(randomInt(100000, 1000000));
}

async function createVerificationToken(
  userId: string,
  type: 'EMAIL_VERIFICATION' | 'LOGIN_OTP' | 'PURCHASE_OTP',
  otp?: string
) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
  // If this is a mock/development user, keep verification tokens in-memory
  if (String(userId).startsWith('u_')) {
    const entry = {
      id: randomUUID(),
      token,
      otp: otp ?? undefined,
      otpHash: null,
      type,
      createdAt: new Date(),
      expiresAt,
      usedAt: null,
      attemptCount: 0,
      usedCount: 0,
    };
    const list = mockVerificationStore.get(userId) ?? [];
    list.unshift(entry);
    mockVerificationStore.set(userId, list);
    return entry;
  }
  // Attempt to atomically invalidate existing tokens for this user/type and create the new token
  const id = randomUUID();
  const now = new Date();

  // Prefer using Prisma client transaction which adapts to schema; compute otpHash ahead of time.
  // If `otp` is provided, we hash it for storage in the DB (`otpHash`) while the in-memory
  // mock store keeps the plaintext `otp` for test lookup. Production uses hashed OTPs.
  let otpHash: string | undefined = undefined;
  if (otp) {
    try {
      const { hashOtp } = await import('./auth/otp');
      otpHash = await hashOtp(otp);
    } catch {
      otpHash = undefined;
    }
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      // invalidate existing tokens for this user/type
      await tx.verificationToken.updateMany({
        where: { userId, type, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now, usedCount: { increment: 1 }, verified: false },
      });
      // create new token (include otpHash if supported) using nested connect for user
      const data = {
        id,
        token,
        type,
        createdAt: now,
        expiresAt,
        user: { connect: { id: userId } },
        ...(otpHash ? { otpHash } : {}),
      };
      return tx.verificationToken.create({ data });
    });
    // In development mode, also keep a copy in-memory for mock users/dev endpoints
    if (process.env.NODE_ENV !== 'production' && otp) {
      const entry = {
        id: randomUUID(),
        token,
        otp,
        otpHash: null,
        type,
        createdAt: new Date(),
        expiresAt,
        usedAt: null,
        attemptCount: 0,
        usedCount: 0,
      };
      const list = mockVerificationStore.get(userId) ?? [];
      list.unshift(entry);
      mockVerificationStore.set(userId, list);
    }
    return created;
  } catch {
    // Fallback: attempt raw SQL transaction to achieve atomic invalidation + insert
    try {
      if (otpHash) {
        await prisma.$transaction([
          prisma.$executeRawUnsafe(
            'UPDATE `VerificationToken` SET `usedAt` = ?, `usedCount` = COALESCE(`usedCount`,0) + 1, `verified` = 0 WHERE `userId` = ? AND `type` = ? AND `usedAt` IS NULL AND `expiresAt` > ?',
            now,
            userId,
            type,
            now
          ),
          prisma.$executeRawUnsafe(
            'INSERT INTO `VerificationToken` (`id`,`userId`,`type`,`token`,`otpHash`,`createdAt`,`expiresAt`) VALUES (?,?,?,?,?,?,?)',
            id,
            userId,
            type,
            token,
            otpHash,
            now,
            expiresAt
          ),
        ]);
      } else {
        await prisma.$transaction([
          prisma.$executeRawUnsafe(
            'UPDATE `VerificationToken` SET `usedAt` = ?, `usedCount` = COALESCE(`usedCount`,0) + 1, `verified` = 0 WHERE `userId` = ? AND `type` = ? AND `usedAt` IS NULL AND `expiresAt` > ?',
            now,
            userId,
            type,
            now
          ),
          prisma.$executeRawUnsafe(
            'INSERT INTO `VerificationToken` (`id`,`userId`,`type`,`token`,`createdAt`,`expiresAt`) VALUES (?,?,?,?,?,?)',
            id,
            userId,
            type,
            token,
            now,
            expiresAt
          ),
        ]);
      }
      if (otp && process.env.NODE_ENV !== 'production') {
        const entry = {
          id: randomUUID(),
          token,
          otp,
          otpHash: null,
          type,
          createdAt: new Date(),
          expiresAt,
          usedAt: null,
          attemptCount: 0,
          usedCount: 0,
        };
        const list = mockVerificationStore.get(userId) ?? [];
        list.unshift(entry);
        mockVerificationStore.set(userId, list);
      }
      const rowsUn = await prisma.$queryRawUnsafe(
        'SELECT * FROM `VerificationToken` WHERE `id` = ?',
        id
      );
      if (Array.isArray(rowsUn) && rowsUn.length)
        return rowsUn[0] as Record<string, unknown>;
      return null;
    } catch {
      return null;
    }
  }
}

export async function invalidateExistingVerificationTokens(
  userId: string,
  type: 'EMAIL_VERIFICATION' | 'LOGIN_OTP' | 'PURCHASE_OTP'
) {
  const now = new Date();

  if (String(userId).startsWith('u_')) {
    const entries = mockVerificationStore.get(userId) ?? [];
    for (const entry of entries) {
      if (
        entry.type !== type ||
        entry.usedAt ||
        entry.expiresAt.getTime() <= now.getTime()
      )
        continue;
      entry.usedAt = now;
      entry.usedCount = (entry.usedCount ?? 0) + 1;
    }
    return;
  }

  try {
    // Use Prisma updateMany for portability and clearer semantics
    await prisma.verificationToken.updateMany({
      where: {
        userId,
        type,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        usedAt: now,
        usedCount: { increment: 1 },
        verified: false,
      },
    });
  } catch {
    // ignore; the next verification check will reject stale tokens anyway.
  }
}

async function findValidVerificationTokenByEmail(
  email: string,
  type: 'EMAIL_VERIFICATION' | 'LOGIN_OTP' | 'PURCHASE_OTP',
  otp: string
): Promise<Record<string, unknown> | null> {
  const normalized = normalizeEmail(email);
  const user =
    (await findDbUserByEmail(normalized).catch(() => null)) ??
    findMockUserByEmail(normalized);
  if (!user) return null;

  if (String(user.id).startsWith('u_')) {
    const entries = mockVerificationStore.get(user.id) ?? [];
    const candidate = entries
      .filter(
        (entry) =>
          entry.type === type &&
          entry.expiresAt.getTime() > Date.now() &&
          !entry.usedAt
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    if (!candidate) return null;
    if (!candidate.otp || candidate.otp !== otp) {
      candidate.attemptCount = (candidate.attemptCount ?? 0) + 1;
      return null;
    }
    if (candidate.attemptCount && candidate.attemptCount >= 5) return null;
    return candidate;
  }

  let candidate: unknown = null;
  try {
    const rowsUn = await prisma.$queryRawUnsafe(
      'SELECT * FROM `VerificationToken` WHERE `userId` = ? AND `type` = ? AND `usedAt` IS NULL AND `expiresAt` > ? ORDER BY `createdAt` DESC LIMIT 1',
      user.id,
      type,
      new Date()
    );
    if (Array.isArray(rowsUn) && rowsUn.length)
      candidate = rowsUn[0] as Record<string, unknown>;
  } catch {
    try {
      candidate = await prisma.verificationToken.findFirst({
        where: {
          userId: user.id,
          type,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      return null;
    }
  }
  if (!candidate) return null;

  // If the DB has an `otpHash` column, prefer bcrypt verification.
  const candidateRecord = candidate as Record<string, unknown>;
  if (candidateRecord.otpHash) {
    const { verifyOtpHash } = await import('./auth/otp');
    const ok = await verifyOtpHash(otp, candidateRecord.otpHash as string);
    if (!ok) {
      await prisma.verificationToken
        .update({
          where: { id: candidateRecord.id as string },
          data: {
            attemptCount: ((candidateRecord.attemptCount as number) ?? 0) + 1,
          },
        })
        .catch(() => undefined);
      return null;
    }
  } else {
    // Fallback: some databases may store plaintext `otp` in a legacy column.
    try {
      const rowsUn = await prisma.$queryRawUnsafe(
        'SELECT `otp` FROM `VerificationToken` WHERE `id` = ?',
        candidateRecord.id
      );
      const stored =
        Array.isArray(rowsUn) && rowsUn[0]
          ? (rowsUn[0] as Record<string, unknown>).otp
          : null;
      if (!stored || stored !== otp) {
        await prisma.verificationToken
          .update({
            where: { id: candidateRecord.id as string },
            data: {
              attemptCount: ((candidateRecord.attemptCount as number) ?? 0) + 1,
            },
          })
          .catch(() => undefined);
        return null;
      }
    } catch {
      // If raw read fails, treat as invalid token to be safe.
      await prisma.verificationToken
        .update({
          where: { id: candidateRecord.id as string },
          data: {
            attemptCount: ((candidateRecord.attemptCount as number) ?? 0) + 1,
          },
        })
        .catch(() => undefined);
      return null;
    }
  }
  if (
    (candidateRecord.attemptCount as number) &&
    (candidateRecord.attemptCount as number) >= 5
  )
    return null;
  return candidateRecord;
}

async function markTokenUsed(tokenId: string) {
  // Handle mock/development tokens in-memory first
  for (const entries of mockVerificationStore.values()) {
    const entry = entries.find((entry) => entry.id === tokenId);
    if (entry) {
      entry.usedAt = new Date();
      entry.usedCount = (entry.usedCount ?? 0) + 1;
      return entry;
    }
  }

  // Use Prisma's updateMany to atomically claim the token when `usedAt` is NULL.
  // `updateMany` returns a count which we can use to determine whether we successfully claimed it.
  try {
    const now = new Date();
    const result = await prisma.verificationToken.updateMany({
      where: { id: tokenId, usedAt: null },
      data: { usedAt: now, usedCount: { increment: 1 }, verified: true },
    });
    // If no rows were affected, another caller already claimed the token
    if (!result.count) return null;
    // Return the updated token record
    return prisma.verificationToken.findUnique({ where: { id: tokenId } });
  } catch {
    // As a last-resort fallback, attempt a non-conditional update (may overwrite but avoids throwing)
    try {
      return await prisma.verificationToken.update({
        where: { id: tokenId },
        data: {
          usedAt: new Date(),
          usedCount: { increment: 1 },
          verified: true,
        },
      });
    } catch {
      return null;
    }
  }
}

export async function logUserActivity(
  userId: string,
  action: string,
  metadata: Record<string, unknown> = {},
  options: { durationMs?: number; sessionId?: string | null } = {}
) {
  try {
    await prisma.userActivity.create({
      data: {
        userId,
        action,
        metadata: metadata as Prisma.InputJsonValue,
        durationMs: options.durationMs ?? 0,
        sessionId: options.sessionId ?? null,
      },
    });
  } catch {
    // ignore activity logging failures to avoid breaking core auth flows
  }
}

function getOptionalUserField(
  user: User | DbUserRecord,
  field: 'avatarUrl' | 'mobile' | 'countryCode'
) {
  if (field === 'avatarUrl') {
    return 'avatarUrl' in user ? (user.avatarUrl ?? undefined) : undefined;
  }
  if (field === 'mobile') {
    return 'mobile' in user ? (user.mobile ?? undefined) : undefined;
  }
  if (field === 'countryCode') {
    return 'countryCode' in user ? (user.countryCode ?? undefined) : undefined;
  }
  return undefined;
}

function getEmailVerificationStatus(user: User | DbUserRecord) {
  return 'emailVerified' in user ? Boolean(user.emailVerified) : false;
}

export function makePublicUser(user: User | DbUserRecord): AuthPublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    name: user.name ?? undefined,
    firstName: user.firstName ?? undefined,
    lastName: user.lastName ?? undefined,
    avatarUrl: getOptionalUserField(user, 'avatarUrl'),
    emailVerified: getEmailVerificationStatus(user),
    mobile: getOptionalUserField(user, 'mobile'),
    countryCode: getOptionalUserField(user, 'countryCode'),
  };
}

export async function parseSession(req: NextApiRequest) {
  const sessionId = getCookieValue(req, SESSION_COOKIE_NAME);
  if (!sessionId) return null;
  try {
    const dbSession = await getSessionByCookieValue(sessionId);
    if (dbSession?.session && dbSession.user) {
      return {
        userId: dbSession.user.id,
        role: dbSession.user.role,
        expiresAt: dbSession.session.expiresAt.getTime(),
      };
    }
  } catch {
    return null;
  }
  return null;
}

export async function assertActiveUserSession(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await parseSession(req);
  if (!session) {
    jsonError(res, 'unauthenticated', 'Authentication is required.', 401);
    return null;
  }

  const user =
    (await findDbUserById(session.userId).catch(() => null)) ??
    findMockUserById(session.userId);
  if (!user) {
    jsonError(res, 'invalid_session', 'Session is invalid or expired.', 401);
    return null;
  }

  if (
    user.role !== 'customer' &&
    user.role !== 'admin' &&
    user.role !== 'manager'
  ) {
    jsonError(res, 'invalid_session', 'Session is invalid or expired.', 401);
    return null;
  }

  return { session, user };
}

export async function requireSession(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return assertActiveUserSession(req, res);
}

export async function requireRole(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedRoles: Role[]
) {
  const auth = await requireSession(req, res);
  if (!auth) return null;
  if (!allowedRoles.includes(auth.user.role)) {
    jsonError(
      res,
      'forbidden',
      'You do not have permission to access this resource.',
      403,
      { allowedRoles }
    );
    return null;
  }
  return auth;
}

export async function setSessionCookie(
  res: NextApiResponse,
  sessionId: string,
  maxAgeSeconds = SESSION_TTL_SECONDS,
  user?: { id: string; role: Role }
) {
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const sessionCookie = `${SESSION_COOKIE_NAME}=${sessionId}; HttpOnly; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secureFlag}`;
  let routeHintCookie = `${ROUTE_HINT_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secureFlag}`;
  if (user) {
    const routeHint = await signRouteHint(
      { userId: user.id, role: user.role },
      maxAgeSeconds
    );
    routeHintCookie = `${ROUTE_HINT_COOKIE_NAME}=${routeHint}; HttpOnly; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secureFlag}`;
  }
  res.setHeader('Set-Cookie', [sessionCookie, routeHintCookie]);
}

export function clearSessionCookie(res: NextApiResponse) {
  res.setHeader('Set-Cookie', [
    `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
    `${ROUTE_HINT_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
  ]);
}

async function findKnownUserByEmail(email: string) {
  return (await findDbUserByEmail(email)) ?? findMockUserByEmail(email);
}

async function findKnownUserByUsername(username: string) {
  return (
    (await findDbUserByUsername(username)) ?? findMockUserByUsername(username)
  );
}

export async function authenticateCredentials(
  identifier: string,
  password: string
) {
  const norm = identifier.trim().toLowerCase();
  let dbUser = null;
  try {
    dbUser = await authenticateDbUser(norm, password);
  } catch (err) {
    // Surface DB/auth errors so callers receive 500 instead of a silent 401
    console.error(
      '[authenticateCredentials] database/auth error:',
      err instanceof Error ? err.message : String(err)
    );
    throw err;
  }
  if (dbUser) return dbUser;
  // Only allow mock user fallback in non-production when explicitly enabled
  const allowMocks =
    process.env.USE_MOCKS === 'true' && process.env.NODE_ENV !== 'production';
  const user = allowMocks
    ? findMockUserByEmail(norm) || findMockUserByUsername(norm)
    : null;
  if (!user) return null;
  if (user.passwordHash !== password) return null;
  return user;
}

function parseLoginBody(req: NextApiRequest) {
  const jsonBody = parseJsonBody<{
    identifier?: string;
    email?: string;
    username?: string;
    password?: string;
    role?: string;
  }>(req);
  if (
    jsonBody &&
    (jsonBody.identifier ||
      jsonBody.email ||
      jsonBody.username ||
      jsonBody.password)
  ) {
    return {
      identifier:
        jsonBody.identifier ?? jsonBody.email ?? jsonBody.username ?? '',
      password: jsonBody.password ?? '',
      role: jsonBody.role ?? 'customer',
    };
  }

  const rawBody = req.body;
  if (typeof rawBody === 'string' && rawBody.includes('=')) {
    const params = new URLSearchParams(rawBody);
    const identifier =
      params.get('identifier') ??
      params.get('email') ??
      params.get('username') ??
      '';
    const password = params.get('password') ?? '';
    const role = params.get('role') ?? 'customer';
    return { identifier, password, role };
  }

  return null;
}

function handleAuthServerError(res: NextApiResponse, error: unknown) {
  void error;
  return jsonError(
    res,
    'server_error',
    'Authentication service is unavailable.',
    500
  );
}

function maskMobile(mobile?: string | null): string | undefined {
  if (!mobile) return undefined;
  const digits = String(mobile).replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return `••••••${digits.slice(-4)}`;
}


export async function handleLogin(req: NextApiRequest, res: NextApiResponse) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

  // Rate limit login attempts per IP/identifier
  // use checkRateLimit directly to avoid circular imports
  try {
    const { checkRateLimit, RATE_LIMIT_CONFIG } = await import('@/lib/redis');
    const ip =
      req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `login:${ip}`;
    const allowed = await checkRateLimit(
      key,
      RATE_LIMIT_CONFIG.LOGIN.limit,
      RATE_LIMIT_CONFIG.LOGIN.windowSeconds
    );
    if (!allowed)
      return jsonError(
        res,
        'rate_limited',
        'Too many login attempts. Try later.',
        429
      );
  } catch (err) {
    if (
      process.env.NODE_ENV === 'production' ||
      process.env.NODE_ENV === 'test'
    ) {
      return jsonError(
        res,
        'rate_limiter_unavailable',
        'Rate limiting unavailable. Try again later.',
        503
      );
    }
    console.warn(
      '[login] Redis check unavailable, continuing in dev mode',
      err instanceof Error ? err.message : String(err)
    );
  }

  try {
    const body = parseLoginBody(req);
    if (!body || !body.identifier || !body.password) {
      return jsonError(
        res,
        'invalid_request',
        'Missing identifier or password.',
        400
      );
    }

    const user = await authenticateCredentials(body.identifier, body.password);
    if (!user)
      return jsonError(
        res,
        'invalid_credentials',
        'Invalid username/email or password.',
        401
      );

    // Server-side role validation: do not trust client-provided role
    const requestedRoleRaw = body.role ?? 'customer';
    const requestedRole = String(requestedRoleRaw).trim().toLowerCase();
    const normalizedUserRole = String(user.role).toLowerCase();
    if (requestedRole !== normalizedUserRole) {
      // Generic 403 without revealing whether the email/username, password, or role was wrong
      return jsonError(
        res,
        'forbidden',
        'Invalid credentials or access denied.',
        403
      );
    }

        // Two-step login: instead of creating a session here, issue a LOGIN_OTP
    // (delivered by SMS) and require the client to confirm it via verify-login.
    try {
      await invalidateExistingVerificationTokens(user.id, 'LOGIN_OTP');
    } catch (err) {
      void err;
    }

    const loginCode = generateOtp();
    const createdLoginToken = await createVerificationToken(
      user.id,
      'LOGIN_OTP',
      loginCode
    );
    const challengeId =
      createdLoginToken &&
      typeof createdLoginToken === 'object' &&
      'id' in createdLoginToken
        ? String((createdLoginToken as Record<string, unknown>).id)
        : null;

    if (!challengeId) {
      return jsonError(
        res,
        'server_error',
        'Unable to create login challenge.',
        500
      );
    }

    // Development retrieval by email (mirrors signup/resend behavior)
    if (
      process.env.USE_MOCKS === 'true' ||
      process.env.NODE_ENV !== 'production'
    ) {
      mockOtpByEmail.set(user.email.trim().toLowerCase(), {
        type: 'LOGIN_OTP',
        otp: loginCode,
        expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
      });
    }

    const userMobile = 'mobile' in user ? user.mobile : undefined;
    if (userMobile) {
      try {
        const okSms = await sendVerificationSMS(userMobile, loginCode);
        if (!okSms) {
          console.error(
            '[login] sendVerificationSMS returned false for',
            userMobile
          );
          return jsonError(
            res,
            'sms_send_failed',
            'Unable to send login code SMS.',
            502
          );
        }
      } catch (err) {
        console.error(
          '[login] sendVerificationSMS error:',
          err instanceof Error ? err.message : String(err)
        );
        return jsonError(
          res,
          'sms_send_failed',
          'Unable to send login code SMS.',
          502
        );
      }
    }

    await logUserActivity(
      user.id,
      'login_otp_sent',
      { method: 'email_or_username', username: user.username },
      { sessionId: null }
    );

    return jsonSuccess(
      res,
      {
        requiresOtp: true,
        challengeId,
        identifier: body.identifier,
        maskedMobile: maskMobile(userMobile),
      },
      200
    );
  } catch (error) {
    return handleAuthServerError(res, error);
  }
}


export async function handleResendVerification(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

  const body = parseJsonBody<{ email?: string }>(req);
  if (!body || !body.email) {
    return jsonError(res, 'invalid_request', 'Email is required.', 400);
  }

  const email = body.email.trim().toLowerCase();
  const user = await findKnownUserByEmail(email);
  if (!user) {
    return jsonError(
      res,
      'invalid_request',
      'Unable to generate verification code for this email.',
      400
    );
  }

  try {
    const { checkRateLimit, RATE_LIMIT_CONFIG } = await import('@/lib/redis');
    const key = `resend:${email}`;
    const allowed = await checkRateLimit(
      key,
      RATE_LIMIT_CONFIG.OTP_RESEND.limit,
      RATE_LIMIT_CONFIG.OTP_RESEND.windowSeconds
    );
    if (!allowed)
      return jsonError(
        res,
        'rate_limited',
        'Too many resend attempts. Try later.',
        429
      );
  } catch (err) {
    if (
      process.env.NODE_ENV === 'production' ||
      process.env.NODE_ENV === 'test'
    ) {
      return jsonError(
        res,
        'rate_limiter_unavailable',
        'Rate limiting unavailable. Try again later.',
        503
      );
    }
    // In development, log a short warning but suppress it during tests.
    if (String(process.env.NODE_ENV) !== 'test') {
      console.warn(
        '[resend] Redis check unavailable, continuing in dev mode',
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  // The 6-digit OTP is delivered by SMS, while the email contains a link that
  // carries the UUID token returned by createVerificationToken.
  const nextCode = generateOtp();
  // Ensure older tokens are invalidated before creating a new one
  try {
    await invalidateExistingVerificationTokens(user.id, 'EMAIL_VERIFICATION');
  } catch (err) {
    // ignore failure to invalidate; the next verification check will reject stale tokens.
    void err;
  }
  const created = await createVerificationToken(
    user.id,
    'EMAIL_VERIFICATION',
    nextCode
  );
  const linkToken =
    created && typeof created === 'object' && 'token' in created
      ? String((created as Record<string, unknown>).token)
      : null;

  if (!linkToken) {
    return jsonError(
      res,
      'server_error',
      'Unable to create verification token.',
      500
    );
  }

  if (
    process.env.USE_MOCKS === 'true' ||
    process.env.NODE_ENV !== 'production'
  ) {
    mockOtpByEmail.set(email, {
      type: 'EMAIL_VERIFICATION',
      otp: nextCode,
      expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
    });
  }

  try {
    const ok = await sendVerificationEmail(email, linkToken);
    if (!ok) {
      console.error('[resend] sendVerificationEmail returned false for', email);
      return jsonError(
        res,
        'email_send_failed',
        'Unable to send verification email.',
        502
      );
    }
  } catch (err) {
    console.error(
      '[resend] sendVerificationEmail error:',
      err instanceof Error ? err.message : String(err)
    );
    return jsonError(
      res,
      'email_send_failed',
      'Unable to send verification email.',
      502
    );
  }
  if ('mobile' in user && user.mobile) {
    try {
      const okSms = await sendVerificationSMS(user.mobile, nextCode);
      if (!okSms) {
        console.error(
          '[resend] sendVerificationSMS returned false for',
          user.mobile
        );
        return jsonError(
          res,
          'sms_send_failed',
          'Unable to send verification SMS.',
          502
        );
      }
    } catch (err) {
      console.error(
        '[resend] sendVerificationSMS error:',
        err instanceof Error ? err.message : String(err)
      );
      return jsonError(
        res,
        'sms_send_failed',
        'Unable to send verification SMS.',
        502
      );
    }
  }
  return jsonSuccess(
    res,
    { message: 'Verification code resent successfully.' },
    200
  );
}

async function findUserForLoginOtp(identifier: string) {
  const trimmed = identifier.trim();
  const norm = trimmed.toLowerCase();

  let dbUser = null;
  try {
    dbUser =
      (await findDbUserByEmail(norm)) ?? (await findDbUserByUsername(trimmed));
  } catch (err) {
    console.error(
      '[verify-login] user lookup error:',
      err instanceof Error ? err.message : String(err)
    );
    dbUser = null;
  }
  if (dbUser) return dbUser;

  const allowMocks =
    process.env.USE_MOCKS === 'true' && process.env.NODE_ENV !== 'production';
  if (!allowMocks) return null;

  return findMockUserByEmail(norm) || findMockUserByUsername(trimmed) || null;
}

export async function handleVerifyLogin(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

  try {
    const { checkRateLimit, RATE_LIMIT_CONFIG } = await import('@/lib/redis');
    const ip =
      req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const allowed = await checkRateLimit(
      `verify-login:${ip}`,
      RATE_LIMIT_CONFIG.LOGIN.limit,
      RATE_LIMIT_CONFIG.LOGIN.windowSeconds
    );
    if (!allowed) {
      return jsonError(
        res,
        'rate_limited',
        'Too many attempts. Try later.',
        429
      );
    }
  } catch (err) {
    if (
      process.env.NODE_ENV === 'production' ||
      process.env.NODE_ENV === 'test'
    ) {
      return jsonError(
        res,
        'rate_limiter_unavailable',
        'Rate limiting unavailable. Try again later.',
        503
      );
    }
    console.warn(
      '[verify-login] Redis check unavailable, continuing in dev mode',
      err instanceof Error ? err.message : String(err)
    );
  }

  try {
    const body = parseJsonBody<{
      identifier?: string;
      otp?: string;
      role?: string;
    }>(req);

    if (!body || !body.identifier || !body.otp) {
      return jsonError(
        res,
        'invalid_request',
        'Identifier and OTP are required.',
        400
      );
    }

    const otp = body.otp.trim();
    const user = await findUserForLoginOtp(body.identifier);

    if (!user) {
      return jsonError(
        res,
        'invalid_verification',
        'The code is invalid or has expired.',
        401
      );
    }

    if (body.role) {
      const requestedRole = String(body.role).trim().toLowerCase();
      if (requestedRole !== String(user.role).toLowerCase()) {
        return jsonError(
          res,
          'forbidden',
          'Invalid credentials or access denied.',
          403
        );
      }
    }

    const verificationToken = await findValidVerificationTokenByEmail(
      user.email,
      'LOGIN_OTP',
      otp
    );

    if (!verificationToken) {
      return jsonError(
        res,
        'invalid_verification',
        'The code is invalid or has expired.',
        401
      );
    }

    const consumed = await markTokenUsed(String(verificationToken.id));
    if (!consumed) {
      return jsonError(
        res,
        'invalid_verification',
        'The code has already been used.',
        401
      );
    }

    const dbSession = await createDbSession(user.id, SESSION_TTL_SECONDS).catch(
      () => null
    );
    if (!dbSession) {
      return jsonError(
        res,
        'session_error',
        'Unable to create a database session.',
        500
      );
    }

    await setSessionCookie(
      res,
      dbSession.token,
      Math.floor((dbSession.expiresAt.getTime() - Date.now()) / 1000),
      user
    );

    await logUserActivity(
      user.id,
      'login',
      { method: 'login_otp', username: user.username },
      { durationMs: 0, sessionId: dbSession.sessionId }
    );

    return jsonSuccess(res, { user: makePublicUser(user) }, 200);
  } catch (error) {
    return handleAuthServerError(res, error);
  }
}

export async function handleSignup(req: NextApiRequest, res: NextApiResponse) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

  try {
    const { checkRateLimit, RATE_LIMIT_CONFIG } = await import('@/lib/redis');
    const reqShape = req as unknown as {
      headers?: Record<string, unknown>;
      socket?: { remoteAddress?: string };
    };
    const rawIp = reqShape.headers && reqShape.headers['x-forwarded-for'];
    const ip =
      typeof rawIp === 'string'
        ? rawIp
        : Array.isArray(rawIp)
          ? (rawIp[0] as string)
          : reqShape.socket?.remoteAddress || 'unknown';
    const signupAllowed = await checkRateLimit(
      `signup:${ip}`,
      RATE_LIMIT_CONFIG.SIGNUP.limit,
      RATE_LIMIT_CONFIG.SIGNUP.windowSeconds
    );
    if (!signupAllowed) {
      return jsonError(
        res,
        'rate_limited',
        'Too many signup attempts. Try later.',
        429
      );
    }

    const body = parseJsonBody<{
      firstName?: string;
      lastName?: string;
      gender?: string;
      username?: string;
      mobile?: string;
      email?: string;
      password?: string;
      avatarUrl?: string;
      verificationCode?: string;
    }>(req);

    // Temporary debug log for the signup request received by the server
    console.error('[signup] request body:', body);

    if (!body) {
      return jsonError(
        res,
        'invalid_request',
        'Request body is required.',
        400
      );
    }

    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const gender = body.gender?.trim();
    const username = body.username?.trim();
    const mobile = body.mobile?.trim();
    // Keep the email exactly as typed; the DB unique index is case-insensitive.
    const email = body.email?.trim();
    const password = body.password?.trim();
    const avatarUrl = body.avatarUrl?.trim() || undefined;

    if (
      !firstName ||
      !lastName ||
      !gender ||
      !username ||
      !mobile ||
      !email ||
      !password
    ) {
      return jsonError(
        res,
        'invalid_request',
        'Please complete every required field.',
        400
      );
    }
    // Reject signup when no profile photo was uploaded
    if (!avatarUrl || typeof avatarUrl !== 'string' || avatarUrl.trim() === '') {
      return jsonError(
        res,
        'invalid_request',
        'Please upload a profile photo.',
        400
      );
    }

    if (
      username.length < 4 ||
      !/[A-Z]/.test(username) ||
      !/[a-z]/.test(username) ||
      !/\d/.test(username)
    ) {
      return jsonError(
        res,
        'invalid_request',
        'Username must be at least 4 characters and include uppercase, lowercase, and a number.',
        400
      );
    }

    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      return jsonError(
        res,
        'invalid_request',
        'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.',
        400
      );
    }

    if (
      (await findKnownUserByEmail(email)) ||
      (await findKnownUserByUsername(username))
    ) {
      return jsonError(
        res,
        'conflict',
        'An account with this email or username already exists.',
        409
      );
    }

    if (!isPhoneNumberValid(mobile)) {
      return jsonError(
        res,
        'invalid_request',
        'Enter a valid phone number.',
        400
      );
    }

    const normalizedMobile = normalizePhoneNumber(mobile);
    let countryCode: string | undefined = undefined;
    try {
      const parsed = parsePhoneNumber(normalizedMobile);
      countryCode = parsed?.countryCallingCode ?? undefined;
    } catch {
      countryCode = undefined;
    }

    const user = await createDbUser({
      username,
      email,
      password,
      role: 'customer',
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      gender,
      mobile: normalizedMobile,
      countryCode: countryCode ?? null,
      avatarUrl,
    });

    if (!user) {
      return jsonError(
        res,
        'conflict',
        'An account with this email or username already exists.',
        409
      );
    }

    // The 6-digit OTP is delivered by SMS, while the email contains a link that
    // carries the UUID token returned by createVerificationToken. Sending the OTP
    // inside the email URL would leak the SMS code and break the verify-email route.
    const nextCode = generateOtp();
    const created = await createVerificationToken(
      user.id,
      'EMAIL_VERIFICATION',
      nextCode
    );
    const linkToken =
      created && typeof created === 'object' && 'token' in created
        ? String((created as Record<string, unknown>).token)
        : null;

    if (!linkToken) {
      return jsonError(
        res,
        'server_error',
        'Unable to create verification token.',
        500
      );
    }

    // In development or when mocks enabled, store OTP by email for test retrieval
    if (
      process.env.USE_MOCKS === 'true' ||
      process.env.NODE_ENV !== 'production'
    ) {
      mockOtpByEmail.set(email, {
        type: 'EMAIL_VERIFICATION',
        otp: nextCode,
        expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
      });
    }

    // Attempt to send verification via email and SMS and surface failures
    try {
      const ok = await sendVerificationEmail(email, linkToken);
      if (!ok) {
        console.error(
          '[signup] sendVerificationEmail returned false for',
          email
        );
        return jsonError(
          res,
          'email_send_failed',
          'Unable to send verification email.',
          502
        );
      }
    } catch (err) {
      console.error(
        '[signup] sendVerificationEmail error:',
        err instanceof Error ? err.message : String(err)
      );
      return jsonError(
        res,
        'email_send_failed',
        'Unable to send verification email.',
        502
      );
    }
    if (user.mobile) {
      try {
        const okSms = await sendVerificationSMS(user.mobile, nextCode);
        if (!okSms) {
          console.error(
            '[signup] sendVerificationSMS returned false for',
            user.mobile
          );
          return jsonError(
            res,
            'sms_send_failed',
            'Unable to send verification SMS.',
            502
          );
        }
      } catch (err) {
        console.error(
          '[signup] sendVerificationSMS error:',
          err instanceof Error ? err.message : String(err)
        );
        return jsonError(
          res,
          'sms_send_failed',
          'Unable to send verification SMS.',
          502
        );
      }
    }

    await logUserActivity(
      user.id,
      'signup',
      { username: user.username, email: user.email },
      { sessionId: null }
    );

    // Do not return OTP in response. clients must use email/sms to retrieve code.
    return jsonSuccess(
      res,
      { user: makePublicUser(user), needsVerification: true },
      201
    );
  } catch (error) {
    return handleAuthServerError(res, error);
  }
}

export async function handleVerifyAccount(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

  const body = parseJsonBody<{ email?: string; code?: string }>(req);
  if (!body || !body.email || !body.code) {
    return jsonError(
      res,
      'invalid_request',
      'Email and verification code are required.',
      400
    );
  }

  const email = body.email.trim().toLowerCase();
  const code = body.code.trim();
  const user = await findKnownUserByEmail(email);

  if (!user) {
    return jsonError(
      res,
      'invalid_verification',
      'The verification code is invalid or has expired.',
      401
    );
  }

  const verificationToken = await findValidVerificationTokenByEmail(
    email,
    'EMAIL_VERIFICATION',
    code
  );
  if (!verificationToken) {
    return jsonError(
      res,
      'invalid_verification',
      'The verification code is invalid or has expired.',
      401
    );
  }

  // enforce expiry and single-use
  const token = verificationToken as Record<string, unknown>;
  if (new Date(token.expiresAt as string).getTime() <= Date.now()) {
    return jsonError(
      res,
      'invalid_verification',
      'The verification code has expired.',
      401
    );
  }
  if (token.usedAt || (token.usedCount && (token.usedCount as number) > 0)) {
    return jsonError(
      res,
      'invalid_verification',
      'The verification code has already been used.',
      401
    );
  }

  const markResult = await markTokenUsed(token.id as string);
  if (!markResult) {
    return jsonError(
      res,
      'invalid_verification',
      'The verification code has already been used.',
      401
    );
  }
  if (String(user.id).startsWith('u_')) {
    user.emailVerified = new Date();
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
  }

  const verifiedUser = String(user.id).startsWith('u_')
    ? user
    : await findDbUserById(user.id);
  const dbSession = await createDbSession(user.id, SESSION_TTL_SECONDS);
  await setSessionCookie(
    res,
    dbSession.token,
    Math.floor((dbSession.expiresAt.getTime() - Date.now()) / 1000),
    { id: user.id, role: user.role }
  );
  await logUserActivity(
    user.id,
    'email_verified',
    { email },
    { sessionId: dbSession.sessionId }
  );

  return jsonSuccess(
    res,
    { user: makePublicUser(verifiedUser ?? user), verified: true },
    200
  );
}

export async function handleLogout(req: NextApiRequest, res: NextApiResponse) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

  const sessionId = getCookieValue(req, SESSION_COOKIE_NAME);
  if (sessionId) {
    const currentSession = await getSessionByCookieValue(sessionId).catch(
      () => null
    );
    if (currentSession?.user) {
      await revokeSessionsForUser(currentSession.user.id).catch(
        () => undefined
      );
    }
    await deleteSessionByCookieValue(sessionId).catch(() => false);
  }
  clearSessionCookie(res);
  return jsonSuccess(res, { message: 'Signed out successfully.' }, 200);
}

export async function handleMe(req: NextApiRequest, res: NextApiResponse) {
  const methodError = validateMethod(req, res, ['GET']);
  if (methodError) return methodError;

  const session = await parseSession(req);
  if (!session) {
    return res.status(401).json({ authenticated: false });
  }

  const user =
    (await findDbUserById(session.userId).catch(() => null)) ??
    findMockUserById(session.userId);
  if (!user) {
    return res.status(401).json({ authenticated: false });
  }

  return res.status(200).json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name:
        user.name ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      username: user.username,
      avatarUrl: getOptionalUserField(user, 'avatarUrl'),
      emailVerified: getEmailVerificationStatus(user),
      mobile: getOptionalUserField(user, 'mobile'),
      countryCode: getOptionalUserField(user, 'countryCode'),
    },
  });
}

// Provide a default export object and CommonJS compatibility so tests and
// various runtime loaders can access functions consistently.
const _exported = {
  SESSION_COOKIE_NAME,
  ROUTE_HINT_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  getLatestMockVerificationOtp,
  makePublicUser,
  parseSession,
  assertActiveUserSession,
  requireSession,
  requireRole,
  setSessionCookie,
  clearSessionCookie,
  authenticateCredentials,
  handleLogin,
  handleVerifyLogin,
  handleLogout,
  handleMe,
  handleResendVerification,
  handleSignup,
  handleVerifyAccount,
  invalidateExistingVerificationTokens,
  logUserActivity,
};

export default _exported;

// If running under CommonJS, make sure `require()` consumers receive the same
// object. Wrap in try/catch to avoid ReferenceErrors in pure ESM runtimes.
try {
  (module as unknown as { exports?: unknown }).exports = _exported;
} catch (e) {
  void e;
}
