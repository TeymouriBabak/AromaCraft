import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
const schema = z.object({ title: z.string().trim().min(2).max(160), body: z.string().trim().min(1).max(20000), image: z.string().url().or(z.literal('')).nullable().optional() });
export default async function handler(req: NextApiRequest, res: NextApiResponse) { const auth = await requireRole(req, res, ['manager', 'admin']); if (!auth) return; try { if (req.method === 'GET') return jsonSuccess(res, { item: await prisma.ourStory.findUnique({ where: { id: 'default' } }) }, 200); if (req.method === 'PUT') { const parsed = schema.safeParse(req.body); if (!parsed.success) return jsonError(res, 'invalid_request', 'Invalid story content.', 400, parsed.error.flatten()); return jsonSuccess(res, { item: await prisma.ourStory.upsert({ where: { id: 'default' }, create: { id: 'default', ...parsed.data }, update: parsed.data }) }, 200); } return jsonError(res, 'method_not_allowed', 'Method not allowed.', 405); } catch (error) { console.error('[manager/content/our-story] failed', error); return jsonError(res, 'server_error', 'Unable to load or save Our Story.', 500); } }
