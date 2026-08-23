import type { NextApiRequest, NextApiResponse } from 'next';
import { devOnly } from '@/lib/middleware/devGuard';
import { sendSuccess } from '@/lib/api-response';
import { listMockUsers } from '@/lib/fixtures/mock-users';

export default devOnly(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // List all seeded mock users (development only)
  // These users are available for testing auth flows locally
  return sendSuccess(res, { users: listMockUsers() }, 200);
});
