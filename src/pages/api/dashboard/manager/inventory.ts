import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonSuccess } from '@/lib/api-utils';

const inventory = [
  { sku: 'CR-050', name: 'Ethiopia Yirgacheffe', stock: 18, threshold: 20 },
  { sku: 'CR-087', name: 'Sumatra Mandheling', stock: 3, threshold: 15 },
  { sku: 'CR-143', name: 'Colombia Reserva', stock: 8, threshold: 12 },
  { sku: 'CR-199', name: 'Velvet House Blend', stock: 22, threshold: 18 },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireRole(req, res, ['manager', 'admin']);
  if (!auth) return;
  return jsonSuccess(res, { inventory }, 200);
}
