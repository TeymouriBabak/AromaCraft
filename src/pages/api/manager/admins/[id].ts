import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess } from '@/lib/api-utils';

const updateSchema = z.object({ role: z.enum(['ADMIN', 'MANAGER']).optional(), disabled: z.boolean().optional() }).refine((value) => value.role !== undefined || value.disabled !== undefined, 'An update is required.');

function publicAdmin(user: { id: string; name: string | null; firstName: string | null; lastName: string | null; email: string; role: string; isBanned: boolean; createdAt: Date }) {
  return { id: user.id, name: user.name ?? ([user.firstName, user.lastName].filter(Boolean).join(' ') || user.email), email: user.email, role: user.role, status: user.isBanned ? 'banned' : 'active', createdAt: user.createdAt, lastLoginAt: null };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;
  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) return jsonError(res, 'invalid_id', 'Admin id is required.', 400);

  try {
    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, firstName: true, lastName: true, email: true, role: true, isBanned: true, createdAt: true } });
    if (!existing || !['ADMIN', 'MANAGER'].includes(existing.role)) return jsonError(res, 'not_found', 'Admin account not found.', 404);

    if (req.method === 'PATCH') {
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) return jsonError(res, 'invalid_request', 'Provide a valid role or disabled value.', 400, parsed.error.flatten());
      if (parsed.data.role && parsed.data.role !== existing.role && existing.id === auth.user.id && parsed.data.role !== 'MANAGER') return jsonError(res, 'forbidden', 'You cannot remove your own manager role.', 403);
      const removesManagerAccess = existing.role === 'MANAGER' && (parsed.data.role === 'ADMIN' || parsed.data.disabled === true);
      if (removesManagerAccess) {
        const managerCount = await prisma.user.count({ where: { role: 'MANAGER', isBanned: false } });
        if (managerCount <= 1) return jsonError(res, 'last_manager', 'The last active manager account cannot be disabled or demoted.', 409);
      }
      const updated = await prisma.user.update({ where: { id }, data: { ...(parsed.data.role ? { role: parsed.data.role } : {}), ...(parsed.data.disabled === undefined ? {} : { isBanned: parsed.data.disabled, bannedAt: parsed.data.disabled ? new Date() : null, bannedBy: parsed.data.disabled ? auth.user.id : null }) }, select: { id: true, name: true, firstName: true, lastName: true, email: true, role: true, isBanned: true, createdAt: true } });
      return jsonSuccess(res, { admin: publicAdmin(updated) }, 200);
    }

    if (req.method === 'DELETE') {
      if (existing.id === auth.user.id) return jsonError(res, 'forbidden', 'You cannot delete your own account.', 403);
      if (existing.role === 'MANAGER') {
        const managerCount = await prisma.user.count({ where: { role: 'MANAGER', isBanned: false } });
        if (managerCount <= 1) return jsonError(res, 'last_manager', 'The last active manager account cannot be removed.', 409);
      }
      const updated = await prisma.user.update({ where: { id }, data: { isBanned: true, bannedAt: new Date(), bannedBy: auth.user.id }, select: { id: true, name: true, firstName: true, lastName: true, email: true, role: true, isBanned: true, createdAt: true } });
      return jsonSuccess(res, { admin: publicAdmin(updated), deactivated: true }, 200);
    }

    return jsonError(res, 'method_not_allowed', 'Method not allowed.', 405);
  } catch (error) {
    console.error('[manager/admins/:id] failed', error);
    return jsonError(res, 'server_error', 'Unable to update admin account.', 500);
  }
}
