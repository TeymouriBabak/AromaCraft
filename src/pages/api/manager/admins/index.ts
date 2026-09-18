import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess } from '@/lib/api-utils';

const createSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required.').max(120),
  email: z.string().trim().email('Enter a valid email address.').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters.').regex(/[A-Z]/, 'Password must include an uppercase letter.').regex(/[a-z]/, 'Password must include a lowercase letter.').regex(/[0-9]/, 'Password must include a number.'),
  role: z.enum(['ADMIN', 'MANAGER']).default('ADMIN'),
});

function publicAdmin(user: { id: string; name: string | null; firstName: string | null; lastName: string | null; email: string; role: string; isBanned: boolean; createdAt: Date; updatedAt: Date }) {
  return { id: user.id, name: user.name ?? ([user.firstName, user.lastName].filter(Boolean).join(' ') || user.email), email: user.email, role: user.role, status: user.isBanned ? 'banned' : 'active', createdAt: user.createdAt, lastLoginAt: null };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;

  try {
    if (req.method === 'GET') {
      const page = Math.max(1, Number(req.query.page ?? 1) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 20) || 20));
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
      const where = { role: { in: ['ADMIN', 'MANAGER'] as ('ADMIN' | 'MANAGER')[] }, ...(search ? { OR: [{ name: { contains: search } }, { firstName: { contains: search } }, { lastName: { contains: search } }, { email: { contains: search } }] } : {}) };
      const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, select: { id: true, name: true, firstName: true, lastName: true, email: true, role: true, isBanned: true, createdAt: true, updatedAt: true } }),
      ]);
      return jsonSuccess(res, { items: users.map(publicAdmin), total, page, pageSize }, 200);
    }

    if (req.method === 'POST') {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) return jsonError(res, 'invalid_request', 'Please correct the admin details.', 400, parsed.error.flatten());
      const email = parsed.data.email.toLowerCase();
      const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (existing) return jsonError(res, 'duplicate_email', 'An account with this email is already registered.', 409);
      const [firstName, ...lastNameParts] = parsed.data.fullName.split(/\s+/);
      const lastName = lastNameParts.join(' ') || null;
      const usernameBase = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 100) || `admin${Date.now()}`;
      let username = usernameBase;
      let suffix = 1;
      while (await prisma.user.findUnique({ where: { username }, select: { id: true } })) username = `${usernameBase}${suffix++}`.slice(0, 120);
      const passwordHash = await bcrypt.hash(parsed.data.password, 12);
      const user = await prisma.user.create({ data: { username, name: parsed.data.fullName, firstName, lastName, email, passwordHash, role: parsed.data.role }, select: { id: true, name: true, firstName: true, lastName: true, email: true, role: true, isBanned: true, createdAt: true, updatedAt: true } });
      return jsonSuccess(res, { admin: publicAdmin(user) }, 201);
    }

    return jsonError(res, 'method_not_allowed', 'Method not allowed.', 405);
  } catch (error) {
    console.error('[manager/admins] failed', error);
    return jsonError(res, 'server_error', 'Unable to load or create admin accounts.', 500);
  }
}
