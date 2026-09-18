import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
const schema = z.object({ question: z.string().trim().min(2).max(300), answer: z.string().trim().min(1).max(10000), sortOrder: z.coerce.number().int().min(0).default(0), isActive: z.boolean().default(true) });
export default async function handler(req: NextApiRequest, res: NextApiResponse) { const auth = await requireRole(req, res, ['manager', 'admin']); if (!auth) return; try { if (req.method === 'GET') return jsonSuccess(res, { items: await prisma.faqEntry.findMany({ orderBy: { sortOrder: 'asc' } }) }, 200); if (req.method === 'POST') { const parsed = schema.safeParse(req.body); if (!parsed.success) return jsonError(res, 'invalid_request', 'Invalid FAQ entry.', 400, parsed.error.flatten()); return jsonSuccess(res, { item: await prisma.faqEntry.create({ data: parsed.data }) }, 201); } return jsonError(res, 'method_not_allowed', 'Method not allowed.', 405); } catch (error) { console.error('[manager/content/faq-entries] failed', error); return jsonError(res, 'server_error', 'Unable to load or save FAQ entries.', 500); } }
