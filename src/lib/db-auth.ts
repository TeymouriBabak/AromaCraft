import { randomBytes, createHash } from 'crypto';
import { compare, hash } from 'bcryptjs';
import { prisma } from './prisma';
import type { UserRole } from '../generated/prisma/enums';

export type AuthRole = 'customer' | 'manager' | 'admin';

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
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

const ROLE_MAP = {
  CUSTOMER: 'customer',
  MANAGER: 'manager',
  ADMIN: 'admin',
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
        mobile: userData.mobile,
        countryCode: userData.countryCode,
        avatarUrl: userData.avatarUrl,
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

  const created = await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
      status: 'ACTIVE',
    },
  });

  return {
    sessionId: created.id,
    token: sessionToken,
    tokenHash,
    expiresAt,
  };
}

export async function getSessionByCookieValue(rawToken?: string | null) {
  if (!rawToken) return null;
  const tokenHash = sha256Hex(rawToken);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.update({
      where: { id: session.id },
      data: { status: 'REVOKED' },
    }).catch(() => undefined);
    return null;
  }

  if (session.status !== 'ACTIVE') {
    return null;
  }

  if (!session.user) return null;
  const mappedUser = mapUser(session.user);
  if (mappedUser.role === 'customer' && session.user.email === '') {
    return null;
  }

  return {
    session,
    user: mappedUser,
  };
}

export async function deleteSessionByCookieValue(rawToken?: string | null) {
  if (!rawToken) return false;
  const tokenHash = sha256Hex(rawToken);
  const session = await prisma.session.findUnique({ where: { tokenHash } });
  if (!session) return false;
  await prisma.session.update({ where: { id: session.id }, data: { status: 'REVOKED' } }).catch(() => undefined);
  return true;
}

export async function revokeSessionsForUser(userId: string) {
  await prisma.session.updateMany({
    where: { userId, status: 'ACTIVE' },
    data: { status: 'REVOKED' },
  });
}

export async function listSessionsForUser(userId: string) {
  return prisma.session.findMany({
    where: { userId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  });
}
