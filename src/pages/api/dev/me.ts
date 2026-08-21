import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonError } from '@/lib/api-utils';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return jsonError(res, 'not_found', 'This route is not available in production.', 404);
}
