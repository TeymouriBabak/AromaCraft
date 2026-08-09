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
import { parsePhoneNumber } from 'libphonenumber-js';
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

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)).padStart(6, '0');
}

async function createVerificationToken(userId: string, type: 'EMAIL_VERIFICATION' | 'LOGIN_OTP' | 'PURCHASE_OTP', otp?: string) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
  return prisma.verificationToken.create({
    data: { userId, type, token, otp, expiresAt },
  });
}

async function findValidVerificationTokenByEmail(email: string, type: 'EMAIL_VERIFICATION' | 'LOGIN_OTP' | 'PURCHASE_OTP', otp: string) {
  const normalized = normalizeEmail(email);
  const user = await findDbUserByEmail(normalized).catch(() => null) ?? findMockUserByEmail(normalized);
  if (!user) return null;
  return prisma.verificationToken.findFirst({
    where: {
      userId: user.id,
      type,
      otp,
      expiresAt: { gt: new Date() },
      usedAt: null,
    },
  });
}

async function markTokenUsed(tokenId: string) {
  return prisma.verificationToken.update({ where: { id: tokenId }, data: { usedAt: new Date() } });
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
  if (error instanceof Error) {
    return jsonError(res, 'server_error', 'Authentication service is unavailable.', 500, { message: error.message });
  }
  return jsonError(res, 'server_error', 'Authentication service is unavailable.', 500);
}

export async function handleLogin(req: NextApiRequest, res: NextApiResponse) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

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

  const nextCode = generateOtp();
  await createVerificationToken(user.id, 'EMAIL_VERIFICATION', nextCode);
  void sendVerificationEmail(email, nextCode).catch(() => undefined);
  if ('mobile' in user && user.mobile) {
    void sendVerificationSMS(user.mobile, nextCode).catch(() => undefined);
  }
  return jsonSuccess(res, { message: `Verification code resent to ${email}.` }, 200);
}

export async function handleSignup(req: NextApiRequest, res: NextApiResponse) {
  const methodError = validateMethod(req, res, ['POST']);
  if (methodError) return methodError;

  try {
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
    const verificationCode = body.verificationCode?.trim();

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

    // best-effort: send verification via email and SMS (development helpers)
    void sendVerificationEmail(email, nextCode).catch(() => undefined);
    if (user.mobile) void sendVerificationSMS(user.mobile, nextCode).catch(() => undefined);

    await logUserActivity(user.id, 'signup', { username: user.username, email: user.email }, { sessionId: null });

    return jsonSuccess(res, { user: makePublicUser(user), needsVerification: true, verificationCode: nextCode }, 201);
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

  await markTokenUsed(verificationToken.id);
  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
  const verifiedUser = await findDbUserById(user.id);
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
