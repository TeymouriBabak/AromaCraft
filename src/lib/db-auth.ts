import { randomBytes, createHash, randomUUID } from 'crypto';
import { compare, hash } from 'bcryptjs';
import { prisma } from './prisma';
import type { UserRole } from '../generated/prisma/enums';
import { normalizePhoneNumber } from './auth-validation';

export type AuthRole = 'customer' | 'manager' | 'admin' | 'super_admin';

function sha256Hex(input: string) {
  return createHash('sha256').update(input).digest('hex');
}

export type DbUserRecord = {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: AuthRole;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  mobile?: string | null;
  countryCode?: string | null;
  avatarUrl?: string | null;
  emailVerified?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

const ROLE_MAP = {
  CUSTOMER: 'customer',
  MANAGER: 'manager',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

function mapRole(role: string): AuthRole {
  return ROLE_MAP[role as keyof typeof ROLE_MAP] ?? 'customer';
}

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
}

function mapUser(user: {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  mobile: string | null;
  countryCode: string | null;
  avatarUrl: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): DbUserRecord {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    passwordHash: user.passwordHash,
    role: mapRole(user.role),
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    gender: user.gender,
    mobile: user.mobile,
    countryCode: user.countryCode,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function findUserByEmail(email: string) {
  const normalized = normalizeIdentifier(email);
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  return user ? mapUser(user) : null;
}

export async function findUserByUsername(username: string) {
  const normalized = normalizeIdentifier(username);
  const user = await prisma.user.findUnique({ where: { username: normalized } });
  return user ? mapUser(user) : null;
}

export async function findUserById(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ? mapUser(user) : null;
}

export async function findUserByMobile(mobileRaw?: string | null) {
  if (!mobileRaw) return null;
  const normalized = normalizePhoneNumber(String(mobileRaw));
  if (!normalized) return null;
  const user = await prisma.user.findFirst({ where: { mobile: normalized } }).catch(() => null);
  return user ? mapUser(user) : null;
}

export async function createDbUser(userData: {
  username: string;
  email: string;
  password: string;
  role?: AuthRole;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  mobile?: string | null;
  countryCode?: string | null;
  avatarUrl?: string | null;
}) {
  const passwordHash = await hash(userData.password, 12);
  const normalizedEmail = normalizeIdentifier(userData.email);
  const normalizedUsername = normalizeIdentifier(userData.username);
  const roleValue = userData.role ? (userData.role.toUpperCase() as UserRole) : 'CUSTOMER';
  const normalizedMobile = userData.mobile ? normalizePhoneNumber(userData.mobile) : null;

  try {
    const created = await prisma.user.create({
        data: {
        username: normalizedUsername,
        email: normalizedEmail,
        passwordHash,
        role: roleValue,
        name: userData.name,
        firstName: userData.firstName,
        lastName: userData.lastName,
        gender: userData.gender,
          mobile: normalizedMobile,
        countryCode: userData.countryCode,
        avatarUrl: userData.avatarUrl,
        emailVerified: null,
      },
    });
    return mapUser(created);
  } catch (error) {
    const prismaError = error as { code?: string };
    if (prismaError?.code === 'P2002') {
      return null;
    }
    throw error;
  }
}

export async function authenticateCredentials(identifier: string, password: string) {
  const normalized = normalizeIdentifier(identifier);
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: normalized },
        { username: normalized },
      ],
    },
  });

  if (!user) return null;
  const valid = await compare(password, user.passwordHash);
  if (!valid) return null;
  return mapUser(user);
}

export async function createDbSession(userId: string, ttlSeconds = 60 * 60 * 24 * 7) {
  const sessionToken = randomBytes(24).toString('hex');
  const tokenHash = sha256Hex(sessionToken);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  const now = new Date();
  const sessionId = randomUUID();

  await prisma.$executeRawUnsafe(
    'INSERT INTO `Session` (`id`,`tokenHash`,`userId`,`status`,`expiresAt`,`createdAt`,`updatedAt`) VALUES (?,?,?,?,?,?,?)',
    sessionId,
    tokenHash,
    userId,
    'ACTIVE',
    expiresAt,
    now,
    now,
  );

  return {
    sessionId,
    token: sessionToken,
    tokenHash,
    expiresAt,
  };
}

export async function getSessionByCookieValue(rawToken?: string | null) {
  if (!rawToken) return null;
  const tokenHash = sha256Hex(rawToken);
  const sessions = await prisma.$queryRawUnsafe(
    'SELECT s.id AS sessionId, s.tokenHash, s.userId, s.status, s.expiresAt, s.createdAt, s.updatedAt, u.id AS userId, u.username, u.email, u.passwordHash, u.role, u.name, u.firstName, u.lastName, u.gender, u.mobile, u.countryCode, u.avatarUrl, u.emailVerified, u.createdAt AS userCreatedAt, u.updatedAt AS userUpdatedAt FROM `Session` s JOIN `User` u ON u.id = s.userId WHERE s.tokenHash = ? LIMIT 1',
    tokenHash,
  ) as unknown[];
  const sessionRow = sessions[0] as Record<string, unknown> | undefined;
  if (!sessionRow) return null;

  if (new Date(sessionRow.expiresAt as string).getTime() <= Date.now()) {
    await prisma.$executeRawUnsafe('UPDATE `Session` SET `status` = ? WHERE `id` = ?', 'REVOKED', sessionRow.sessionId as string).catch(() => undefined);
    return null;
  }

  if (sessionRow.status !== 'ACTIVE') {
    return null;
  }

  if (!sessionRow.userId) return null;

  const mappedUser = mapUser({
    id: sessionRow.userId as string,
    username: sessionRow.username as string,
    email: sessionRow.email as string,
    passwordHash: sessionRow.passwordHash as string,
    role: sessionRow.role as string,
    name: sessionRow.name as string,
    firstName: sessionRow.firstName as string,
    lastName: sessionRow.lastName as string,
    gender: sessionRow.gender as string,
    mobile: sessionRow.mobile as string,
    countryCode: sessionRow.countryCode as string,
    avatarUrl: sessionRow.avatarUrl as string,
    emailVerified: sessionRow.emailVerified as Date | null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  if (mappedUser.role === 'customer' && sessionRow.email === '') {
    return null;
  }

  return {
    session: {
      id: sessionRow.sessionId as string,
      tokenHash: sessionRow.tokenHash as string,
      userId: sessionRow.userId as string,
      status: sessionRow.status as string,
      expiresAt: new Date(sessionRow.expiresAt as string),
      createdAt: new Date(sessionRow.createdAt as string),
      updatedAt: new Date(sessionRow.updatedAt as string),
    },
    user: mappedUser,
  };
}

export async function deleteSessionByCookieValue(rawToken?: string | null) {
  if (!rawToken) return false;
  const tokenHash = sha256Hex(rawToken);
  const session = await prisma.$queryRawUnsafe('SELECT `id` FROM `Session` WHERE `tokenHash` = ? LIMIT 1', tokenHash) as unknown[];
  if (!session || session.length === 0) return false;
  await prisma.$executeRawUnsafe('UPDATE `Session` SET `status` = ? WHERE `id` = ?', 'REVOKED', (session[0] as Record<string, unknown>).id).catch(() => undefined);
  return true;
}

export async function revokeSessionsForUser(userId: string) {
  await prisma.$executeRawUnsafe('UPDATE `Session` SET `status` = ? WHERE `userId` = ? AND `status` = ?', 'REVOKED', userId, 'ACTIVE');
}

export async function listSessionsForUser(userId: string) {
  const rows = await prisma.$queryRawUnsafe(
    'SELECT `id`,`tokenHash`,`userId`,`status`,`expiresAt`,`createdAt`,`updatedAt` FROM `Session` WHERE `userId` = ? AND `status` = ? ORDER BY `createdAt` DESC',
    userId,
    'ACTIVE',
  ) as unknown[];
  return rows.map((row) => {
    const rowRecord = row as Record<string, unknown>;
    return {
      id: rowRecord.id as string,
      tokenHash: rowRecord.tokenHash as string,
      userId: rowRecord.userId as string,
      status: rowRecord.status as string,
      expiresAt: new Date(rowRecord.expiresAt as string),
      createdAt: new Date(rowRecord.createdAt as string),
      updatedAt: new Date(rowRecord.updatedAt as string),
    };
  });
}
