import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;
  if (req.method !== 'GET') return jsonError(res, 'method_not_allowed', 'Method not allowed', 405);
  try {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
    const customers = await prisma.user.findMany({ where: { role: 'CUSTOMER', createdAt: { gte: start } }, select: { createdAt: true } });
    const months = Array.from({ length: 12 }, (_, index) => new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1)));
    const series = months.map((month) => { const nextMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)); return { month: month.toISOString().slice(0, 7), label: month.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }), newCustomers: customers.filter((customer) => customer.createdAt >= month && customer.createdAt < nextMonth).length }; });
    const current = series[11]?.newCustomers ?? 0;
    const previous = series[10]?.newCustomers ?? 0;
    const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER', isBanned: false } });
    return jsonSuccess(res, { series, totalCustomers, newThisMonth: current, growthRate: previous ? Math.round(((current - previous) / previous) * 1000) / 10 : null }, 200);
  } catch (error) {
    console.error('[manager/reports/customer-growth] failed', error);
    return jsonError(res, 'server_error', 'Unable to fetch customer growth report', 500);
  }
}