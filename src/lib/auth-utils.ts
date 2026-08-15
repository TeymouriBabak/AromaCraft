import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import {
  findUserByEmail as findMockUserByEmail,
  findUserByUsername as findMockUserByUsername,
  findUserById as findMockUserById,
  Role,
  User,
} from './mock-auth';
import { jsonError, jsonSuccess, getCookieValue, validateMethod, parseJsonBody } from './api-utils';
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
const globalMockVerificationStore = (globalThis as unknown as { __aromacraftMockVerificationStore?: Map<string, Array<{ id: string; token: string; otp?: string; otpHash?: string | null; type: string; createdAt: Date; expiresAt: Date; usedAt?: Date | null; attemptCount?: number; usedCount?: number }>> }).__aromacraftMockVerificationStore;
const mockVerificationStore = globalMockVerificationStore ?? new Map<string, Array<{ id: string; token: string; otp?: string; otpHash?: string | null; type: string; createdAt: Date; expiresAt: Date; usedAt?: Date | null; attemptCount?: number; usedCount?: number }>>();
if (!globalMockVerificationStore) {
  (globalThis as unknown as { __aromacraftMockVerificationStore?: typeof mockVerificationStore }).__aromacraftMockVerificationStore = mockVerificationStore;
}

// In-memory store for development OTPs keyed by email (for easy test retrieval)
const globalMockOtpByEmail = (globalThis as unknown as { __aromacraftMockOtpByEmail?: Map<string, { type: string; otp: string; expiresAt: Date }> }).__aromacraftMockOtpByEmail;
const mockOtpByEmail = globalMockOtpByEmail ?? new Map<string, { type: string; otp: string; expiresAt: Date }>();
if (!globalMockOtpByEmail) {
  (globalThis as unknown as { __aromacraftMockOtpByEmail?: typeof mockOtpByEmail }).__aromacraftMockOtpByEmail = mockOtpByEmail;
}

export function getLatestMockVerificationOtp(email: string, type: 'EMAIL_VERIFICATION' | 'LOGIN_OTP' | 'PURCHASE_OTP') {
  const normalized = normalizeEmail(email);
  
  // First check email-keyed store (for development)
  const emailEntry = mockOtpByEmail.get(normalized);
  if (emailEntry && emailEntry.type === type && emailEntry.expiresAt.getTime() > Date.now()) {
    return emailEntry.otp;
  }
  
  // Then check user-ID-keyed store (for in-memory mock users)
  const mockUser = findMockUserByEmail(normalized);
  if (mockUser) {
    const entries = mockVerificationStore.get(mockUser.id) ?? [];
    const candidate = entries.find((entry) => entry.type === type && entry.expiresAt.getTime() > Date.now() && !entry.usedAt);
    if (candidate?.otp) return candidate.otp;
  }
  
  return null;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)).padStart(6, '0');
}

async function createVerificationToken(userId: string, type: 'EMAIL_VERIFICATION' | 'LOGIN_OTP' | 'PURCHASE_OTP', otp?: string) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
  // If this is a mock/development user, keep verification tokens in-memory
  if (String(userId).startsWith('u_')) {
    const entry = { id: randomUUID(), token, otp: otp ?? undefined, otpHash: null, type, createdAt: new Date(), expiresAt, usedAt: null, attemptCount: 0, usedCount: 0 };
    const list = mockVerificationStore.get(userId) ?? [];
    list.unshift(entry);
    mockVerificationStore.set(userId, list);
    return entry;
  }

  // Use a raw INSERT and SELECT using minimal columns so this works against
  // databases that may lack newer columns. Avoid Prisma client create which
  // can fail if the DB schema is older than the client schema.
  const id = randomUUID();
  let created: unknown = null;
  await prisma.$executeRawUnsafe('INSERT INTO `VerificationToken` (`id`,`userId`,`type`,`token`,`createdAt`,`expiresAt`) VALUES (?,?,?,?,?,?)', id, userId, type, token, new Date(), expiresAt);
  const rows = await prisma.$queryRawUnsafe('SELECT * FROM `VerificationToken` WHERE `id` = ?', id) as unknown[];
  created = rows[0];

  if (otp) {
    try {
      const { hashOtp } = await import('./auth/otp');
      const otpHash = await hashOtp(otp);
      try {
        const createdRecord = created as Record<string, unknown>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await prisma.verificationToken.update({ where: { id: String(createdRecord.id) }, data: { otpHash } as any });
      } catch {
        // If update via Prisma fails, try raw update
        await prisma.$executeRawUnsafe('UPDATE `VerificationToken` SET `otpHash` = ? WHERE `id` = ?', otpHash, (created as Record<string, unknown>).id);
      }
    } catch {
      try {
        await prisma.$executeRawUnsafe('UPDATE `VerificationToken` SET `otp` = ? WHERE `id` = ?', otp, (created as Record<string, unknown>).id);
      } catch {
        // ignore
      }
    }

    // In development mode, also store in mock store for dev endpoint retrieval
    if (process.env.NODE_ENV !== 'production') {
      const entry = { id: randomUUID(), token, otp, otpHash: null, type, createdAt: new Date(), expiresAt, usedAt: null, attemptCount: 0, usedCount: 0 };
      const list = mockVerificationStore.get(userId) ?? [];
      list.unshift(entry);
      mockVerificationStore.set(userId, list);
      
      // Also store by email for easy dev endpoint retrieval
      // We'll look this up later when we need it
    }
  }

  return created;
}

export async function invalidateExistingVerificationTokens(userId: string, type: 'EMAIL_VERIFICATION' | 'LOGIN_OTP' | 'PURCHASE_OTP') {
  const now = new Date();

  if (String(userId).startsWith('u_')) {
    const entries = mockVerificationStore.get(userId) ?? [];
    for (const entry of entries) {
      if (entry.type !== type || entry.usedAt || entry.expiresAt.getTime() <= now.getTime()) continue;
      entry.usedAt = now;
      entry.usedCount = (entry.usedCount ?? 0) + 1;
    }
    return;
  }

  try {
    await prisma.$executeRawUnsafe(
      'UPDATE `VerificationToken` SET `usedAt` = ?, `usedCount` = COALESCE(`usedCount`, 0) + 1, `verified` = 0 WHERE `userId` = ? AND `type` = ? AND `usedAt` IS NULL AND `expiresAt` > ?',
      now,
      userId,
      type,
      now,
    );
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
  const user = await findDbUserByEmail(normalized).catch(() => null) ?? findMockUserByEmail(normalized);
  if (!user) return null;

  if (String(user.id).startsWith('u_')) {
    const entries = mockVerificationStore.get(user.id) ?? [];
    const candidate = entries
      .filter((entry) => entry.type === type && entry.expiresAt.getTime() > Date.now() && !entry.usedAt)
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
    const rows = await prisma.$queryRawUnsafe('SELECT * FROM `VerificationToken` WHERE `userId` = ? AND `type` = ? AND `usedAt` IS NULL AND `expiresAt` > ? ORDER BY `createdAt` DESC LIMIT 1', user.id, type, new Date()) as unknown[];
    if (rows && rows.length) candidate = rows[0];
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      candidate = await prisma.verificationToken.findFirst({ where: { userId: user.id, type, usedAt: null, expiresAt: { gt: new Date() } } as any, orderBy: { createdAt: 'desc' } as any });
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
      await prisma.verificationToken.update({ where: { id: candidateRecord.id as string }, data: { attemptCount: ((candidateRecord.attemptCount as number) ?? 0) + 1 } }).catch(() => undefined);
      return null;
    }
  } else {
    // Fallback: some databases may store plaintext `otp` in a legacy column.
    try {
      const rows = await prisma.$queryRawUnsafe('SELECT `otp` FROM `VerificationToken` WHERE `id` = ?', candidateRecord.id) as unknown[];
      const stored = rows && rows[0] ? (rows[0] as Record<string, unknown>).otp : null;
      if (!stored || stored !== otp) {
        await prisma.verificationToken.update({ where: { id: candidateRecord.id as string }, data: { attemptCount: ((candidateRecord.attemptCount as number) ?? 0) + 1 } }).catch(() => undefined);
        return null;
      }
    } catch {
      // If raw read fails, treat as invalid token to be safe.
      await prisma.verificationToken.update({ where: { id: candidateRecord.id as string }, data: { attemptCount: ((candidateRecord.attemptCount as number) ?? 0) + 1 } }).catch(() => undefined);
      return null;
    }
  }
  if ((candidateRecord.attemptCount as number) && (candidateRecord.attemptCount as number) >= 5) return null;
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
      where: { id: tokenId, usedAt: null } as any,
      data: { usedAt: now, usedCount: { increment: 1 }, verified: true } as any,
    });
    // If no rows were affected, another caller already claimed the token
    if (!result.count) return null;
    // Return the updated token record
    return prisma.verificationToken.findUnique({ where: { id: tokenId } });
  } catch {
    // As a last-resort fallback, attempt a non-conditional update (may overwrite but avoids throwing)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await prisma.verificationToken.update({ where: { id: tokenId }, data: { usedAt: new Date(), usedCount: { increment: 1 }, verified: true } as any });
    } catch {
      return null;
    }
  }
}

export async function logUserActivity(
  userId: string,
  action: string,
  metadata: Record<string, unknown> = {},
  options: { durationMs?: number; sessionId?: string | null } = {},
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

function getOptionalUserField(user: User | DbUserRecord, field: 'avatarUrl' | 'mobile' | 'countryCode') {
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
      return { userId: dbSession.user.id, role: dbSession.user.role, expiresAt: dbSession.session.expiresAt.getTime() };
    }
  } catch {
    return null;
  }
  return null;
}

export async function assertActiveUserSession(req: NextApiRequest, res: NextApiResponse) {
  const session = await parseSession(req);
  if (!session) {
    jsonError(res, 'unauthenticated', 'Authentication is required.', 401);
    return null;
  }

  const user = await findDbUserById(session.userId).catch(() => null) ?? findMockUserById(session.userId);
  if (!user) {
    jsonError(res, 'invalid_session', 'Session is invalid or expired.', 401);
    return null;
  }

  if (user.role !== 'customer' && user.role !== 'manager' && user.role !== 'admin') {
    jsonError(res, 'invalid_session', 'Session is invalid or expired.', 401);
    return null;
  }

  return { session, user };
}

export async function requireSession(req: NextApiRequest, res: NextApiResponse) {
  return assertActiveUserSession(req, res);
}

export async function requireRole(req: NextApiRequest, res: NextApiResponse, allowedRoles: Role[]) {
  const auth = await requireSession(req, res);
  if (!auth) return null;
  if (!allowedRoles.includes(auth.user.role)) {
    jsonError(res, 'forbidden', 'You do not have permission to access this resource.', 403, { allowedRoles });
    return null;
  }
  return auth;
}

export async function setSessionCookie(
  res: NextApiResponse,
  sessionId: string,
  maxAgeSeconds = SESSION_TTL_SECONDS,
  user?: { id: string; role: Role },
) {
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const sessionCookie = `${SESSION_COOKIE_NAME}=${sessionId}; HttpOnly; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secureFlag}`;
  let routeHintCookie = `${ROUTE_HINT_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secureFlag}`;
  if (user) {
    const routeHint = await signRouteHint({ userId: user.id, role: user.role }, maxAgeSeconds);
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
  return (await findDbUserByUsername(username)) ?? findMockUserByUsername(username);
}

export async function authenticateCredentials(identifier: string, password: string) {
  const norm = identifier.trim().toLowerCase();
  const dbUser = await authenticateDbUser(norm, password).catch(() => null);
  if (dbUser) return dbUser;
  const user = findMockUserByEmail(norm) || findMockUserByUsername(norm);
  if (!user) return null;
  if (user.passwordHash !== password) return null;
  return user;
}

function parseLoginBody(req: NextApiRequest) {
  const jsonBody = parseJsonBody<{ identifier?: string; email?: string; username?: string; password?: string; role?: string }>(req);
  if (jsonBody && (jsonBody.identifier || jsonBody.email || jsonBody.username || jsonBody.password)) {
    return {
      identifier: jsonBody.identifier ?? jsonBody.email ?? jsonBody.username ?? '',
      password: jsonBody.password ?? '',
      role: jsonBody.role ?? 'customer',
    };
  }

  const rawBody = req.body;
  if (typeof rawBody === 'string' && rawBody.includes('=')) {
    const params = new URLSearchParams(rawBody);
    const identifier = params.get('identifier') ?? params.get('email') ?? params.get('username') ?? '';
    const password = params.get('password') ?? '';
    const role = params.get('role') ?? 'customer';
    return { identifier, password, role };
  }

  return null;
}

function handleAuthServerError(res: NextApiResponse, error: unknown) {
  void error;
  return jsonError(res, 'server_error', 'Authentication service is unavailable.', 500);
}

export async function handleLogin(req: NextApiRequest, res: NextApiResponse) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

  // Rate limit login attempts per IP/identifier
  // use checkRateLimit directly to avoid circular imports
  try {
    const { checkRateLimit, RATE_LIMIT_CONFIG } = await import('@/lib/redis');
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `login:${ip}`;
    const allowed = await checkRateLimit(key, RATE_LIMIT_CONFIG.LOGIN.limit, RATE_LIMIT_CONFIG.LOGIN.windowSeconds);
    if (!allowed) return jsonError(res, 'rate_limited', 'Too many login attempts. Try later.', 429);
  } catch {
    // ignore redis failures
  }

  try {
    const body = parseLoginBody(req);
    if (!body || !body.identifier || !body.password) {
      return jsonError(res, 'invalid_request', 'Missing identifier or password.', 400);
    }

    const user = await authenticateCredentials(body.identifier, body.password);
    if (!user) return jsonError(res, 'invalid_credentials', 'Invalid username/email or password.', 401);

    const requestedRole = (body.role ?? 'customer').toLowerCase();
    if (requestedRole && requestedRole !== user.role && requestedRole !== 'admin' && user.role !== requestedRole) {
      return jsonError(res, 'forbidden', 'Selected login role does not match this account.', 403);
    }
    if (requestedRole && requestedRole !== user.role) {
      return jsonError(res, 'forbidden', 'You do not have access with the selected role.', 403);
    }

    const dbSession = await createDbSession(user.id, SESSION_TTL_SECONDS).catch(() => null);
    if (!dbSession) {
      return jsonError(res, 'session_error', 'Unable to create a database session.', 500);
    }

    await setSessionCookie(res, dbSession.token, Math.floor((dbSession.expiresAt.getTime() - Date.now()) / 1000), { id: user.id, role: user.role });
    await logUserActivity(user.id, 'login', { method: 'email_or_username', username: user.username }, { durationMs: 0, sessionId: dbSession.sessionId });
    return jsonSuccess(res, { user: makePublicUser(user) }, 200);
  } catch (error) {
    return handleAuthServerError(res, error);
  }
}

export async function handleResendVerification(req: NextApiRequest, res: NextApiResponse) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

  const body = parseJsonBody<{ email?: string }>(req);
  if (!body || !body.email) {
    return jsonError(res, 'invalid_request', 'Email is required.', 400);
  }

  const email = body.email.trim().toLowerCase();
  const user = await findKnownUserByEmail(email);
  if (!user) {
    return jsonError(res, 'invalid_request', 'Unable to generate verification code for this email.', 400);
  }

  try {
    const { checkRateLimit, RATE_LIMIT_CONFIG } = await import('@/lib/redis');
    const key = `resend:${email}`;
    const allowed = await checkRateLimit(key, RATE_LIMIT_CONFIG.OTP_RESEND.limit, RATE_LIMIT_CONFIG.OTP_RESEND.windowSeconds);
    if (!allowed) return jsonError(res, 'rate_limited', 'Too many resend attempts. Try later.', 429);
  } catch {
    if (process.env.NODE_ENV === 'production') {
      return jsonError(res, 'rate_limiter_unavailable', 'Rate limiting unavailable. Try again later.', 503);
    }
    console.warn('[resend] Redis check unavailable, continuing in dev mode');
  }

  await invalidateExistingVerificationTokens(user.id, 'EMAIL_VERIFICATION');

  const nextCode = generateOtp();
  await createVerificationToken(user.id, 'EMAIL_VERIFICATION', nextCode);

  if (process.env.NODE_ENV !== 'production') {
    mockOtpByEmail.set(email, { type: 'EMAIL_VERIFICATION', otp: nextCode, expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS) });
  }

  void sendVerificationEmail(email, nextCode).catch(() => undefined);
  if ('mobile' in user && user.mobile) {
    void sendVerificationSMS(user.mobile, nextCode).catch(() => undefined);
  }
  return jsonSuccess(res, { message: 'Verification code resent successfully.' }, 200);
}

export async function handleSignup(req: NextApiRequest, res: NextApiResponse) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

  try {
    const { checkRateLimit, RATE_LIMIT_CONFIG } = await import('@/lib/redis');
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const signupAllowed = await checkRateLimit(`signup:${ip}`, RATE_LIMIT_CONFIG.SIGNUP.limit, RATE_LIMIT_CONFIG.SIGNUP.windowSeconds);
    if (!signupAllowed) {
      return jsonError(res, 'rate_limited', 'Too many signup attempts. Try later.', 429);
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

    if (!body) {
      return jsonError(res, 'invalid_request', 'Request body is required.', 400);
    }

    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const gender = body.gender?.trim();
    const username = body.username?.trim();
    const mobile = body.mobile?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();
    const avatarUrl = body.avatarUrl?.trim() || undefined;

    if (!firstName || !lastName || !gender || !username || !mobile || !email || !password) {
      return jsonError(res, 'invalid_request', 'Please complete every required field.', 400);
    }

    if (username.length < 4 || !/[A-Z]/.test(username) || !/[a-z]/.test(username) || !/\d/.test(username)) {
      return jsonError(res, 'invalid_request', 'Username must be at least 4 characters and include uppercase, lowercase, and a number.', 400);
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      return jsonError(res, 'invalid_request', 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.', 400);
    }

    if (
      await findKnownUserByEmail(email) ||
      await findKnownUserByUsername(username)
    ) {
      return jsonError(res, 'conflict', 'An account with this email or username already exists.', 409);
    }

    if (!isPhoneNumberValid(mobile)) {
      return jsonError(res, 'invalid_request', 'Enter a valid phone number.', 400);
    }

    const normalizedMobile = normalizePhoneNumber(mobile);
    const countryCode = normalizedMobile.startsWith('+') ? normalizedMobile.slice(1, 3) : undefined;

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
      return jsonError(res, 'conflict', 'An account with this email or username already exists.', 409);
    }

    const nextCode = generateOtp();
    await createVerificationToken(user.id, 'EMAIL_VERIFICATION', nextCode);

    // In development, store OTP by email for test retrieval
    if (process.env.NODE_ENV !== 'production') {
      mockOtpByEmail.set(email, { type: 'EMAIL_VERIFICATION', otp: nextCode, expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS) });
    }

    // best-effort: send verification via email and SMS (development providers)
    void sendVerificationEmail(email, nextCode).catch(() => undefined);
    if (user.mobile) void sendVerificationSMS(user.mobile).catch(() => undefined);

    await logUserActivity(user.id, 'signup', { username: user.username, email: user.email }, { sessionId: null });

    // Do not return OTP in response. clients must use email/sms to retrieve code.
    return jsonSuccess(res, { user: makePublicUser(user), needsVerification: true }, 201);
  } catch (error) {
    return handleAuthServerError(res, error);
  }
}

export async function handleVerifyAccount(req: NextApiRequest, res: NextApiResponse) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

  const body = parseJsonBody<{ email?: string; code?: string }>(req);
  if (!body || !body.email || !body.code) {
    return jsonError(res, 'invalid_request', 'Email and verification code are required.', 400);
  }

  const email = body.email.trim().toLowerCase();
  const code = body.code.trim();
  const user = await findKnownUserByEmail(email);

  if (!user) {
    return jsonError(res, 'invalid_verification', 'The verification code is invalid or has expired.', 401);
  }

  const verificationToken = await findValidVerificationTokenByEmail(email, 'EMAIL_VERIFICATION', code);
  if (!verificationToken) {
    return jsonError(res, 'invalid_verification', 'The verification code is invalid or has expired.', 401);
  }

  // enforce expiry and single-use
  const token = verificationToken as Record<string, unknown>;
  if (new Date(token.expiresAt as string).getTime() <= Date.now()) {
    return jsonError(res, 'invalid_verification', 'The verification code has expired.', 401);
  }
  if ((token.usedAt) || (token.usedCount && (token.usedCount as number) > 0)) {
    return jsonError(res, 'invalid_verification', 'The verification code has already been used.', 401);
  }

  const markResult = await markTokenUsed(token.id as string);
  if (!markResult) {
    return jsonError(res, 'invalid_verification', 'The verification code has already been used.', 401);
  }
  if (String(user.id).startsWith('u_')) {
    user.emailVerified = new Date();
  } else {
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
  }

  const verifiedUser = String(user.id).startsWith('u_') ? user : await findDbUserById(user.id);
  const dbSession = await createDbSession(user.id, SESSION_TTL_SECONDS);
  await setSessionCookie(res, dbSession.token, Math.floor((dbSession.expiresAt.getTime() - Date.now()) / 1000), { id: user.id, role: user.role });
  await logUserActivity(user.id, 'email_verified', { email }, { sessionId: dbSession.sessionId });

  return jsonSuccess(res, { user: makePublicUser(verifiedUser ?? user), verified: true }, 200);
}

export async function handleLogout(req: NextApiRequest, res: NextApiResponse) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

  const sessionId = getCookieValue(req, SESSION_COOKIE_NAME);
  if (sessionId) {
    const currentSession = await getSessionByCookieValue(sessionId).catch(() => null);
    if (currentSession?.user) {
      await revokeSessionsForUser(currentSession.user.id).catch(() => undefined);
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

  const user = await findDbUserById(session.userId).catch(() => null) ?? findMockUserById(session.userId);
  if (!user) {
    return res.status(401).json({ authenticated: false });
  }

  return res.status(200).json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
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
