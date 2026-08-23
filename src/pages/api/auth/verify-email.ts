import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!token) return res.redirect(302, '/login?emailVerified=invalid');

  const record = await prisma.verificationToken.findFirst({
    where: { token, type: 'EMAIL_VERIFICATION', expiresAt: { gt: new Date() } },
  });

  if (!record) return res.redirect(302, '/login?emailVerified=expired');

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { id: record.id } }),
  ]);

  return res.redirect(302, '/login?emailVerified=1');
}
