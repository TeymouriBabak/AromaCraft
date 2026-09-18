import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { createDbUser } from '@/lib/db-auth';
import { normalizePhoneNumber } from '@/lib/auth-validation';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required.').max(120),
  email: z.string().trim().email('Enter a valid email address.').max(255),
  phone: z.string().trim().max(40).optional().default(''),
  password: z.string().min(8, 'Temporary password must be at least 8 characters.').regex(/[A-Z]/, 'Temporary password must include an uppercase letter.').regex(/[a-z]/, 'Temporary password must include a lowercase letter.').regex(/[0-9]/, 'Temporary password must include a number.'),
});

function safeCustomer(user: { id: string; name: string | null; firstName: string | null; lastName: string | null; email: string; mobile: string | null; role: string; isBanned: boolean; createdAt: Date }) {
  return { id: user.id, name: user.name ?? ([user.firstName, user.lastName].filter(Boolean).join(' ') || user.email), email: user.email, phone: user.mobile, role: user.role, status: user.isBanned ? 'banned' : 'active', createdAt: user.createdAt };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;
  try {
    if (req.method === 'GET') {
      const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20) || 20));
      const users = await prisma.user.findMany({ where: { role: 'CUSTOMER' }, orderBy: { createdAt: 'desc' }, take: limit, select: { id: true, name: true, firstName: true, lastName: true, email: true, mobile: true, role: true, isBanned: true, createdAt: true } });
      return jsonSuccess(res, { items: users.map(safeCustomer) }, 200);
    }
    if (req.method !== 'POST') return jsonError(res, 'method_not_allowed', 'Method not allowed.', 405);
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return jsonError(res, 'invalid_request', 'Please correct the customer details.', 400, parsed.error.flatten());
    const email = parsed.data.email.toLowerCase();
    const mobile = parsed.data.phone ? normalizePhoneNumber(parsed.data.phone) : null;
    if (parsed.data.phone && !mobile) return jsonError(res, 'invalid_phone', 'Enter a valid phone number.', 400, { fieldErrors: { phone: ['Enter a valid phone number.'] } });
    const duplicate = await prisma.user.findFirst({ where: { OR: [{ email }, ...(mobile ? [{ mobile }] : [])] }, select: { email: true, mobile: true } });
    if (duplicate?.email === email) return jsonError(res, 'duplicate_email', 'This email is already registered.', 409, { fieldErrors: { email: ['This email is already registered.'] } });
    if (mobile && duplicate?.mobile === mobile) return jsonError(res, 'duplicate_phone', 'This phone number is already registered.', 409, { fieldErrors: { phone: ['This phone number is already registered.'] } });
    const [firstName, ...lastNameParts] = parsed.data.fullName.split(/\s+/);
    const base = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 100) || `customer${Date.now()}`;
    let username = base;
    let suffix = 1;
    while (await prisma.user.findUnique({ where: { username }, select: { id: true } })) username = `${base}${suffix++}`.slice(0, 120);
    const created = await createDbUser({ username, email, password: parsed.data.password, role: 'customer', name: parsed.data.fullName, firstName, lastName: lastNameParts.join(' ') || null, mobile });
    if (!created) return jsonError(res, 'duplicate', 'An account with these details already exists.', 409);
    const user = await prisma.user.findUnique({ where: { id: created.id }, select: { id: true, name: true, firstName: true, lastName: true, email: true, mobile: true, role: true, isBanned: true, createdAt: true } });
    if (!user) return jsonError(res, 'server_error', 'Customer was created but could not be loaded.', 500);
    return jsonSuccess(res, { customer: safeCustomer(user) }, 201);
  } catch (error) {
    console.error('[manager/customers] failed', error);
    return jsonError(res, 'server_error', 'Unable to load or register customer.', 500);
  }
}
