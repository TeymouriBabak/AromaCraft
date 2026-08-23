import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { prisma } from '../prisma';

export const OTP = {
  async create(userId: string, code: string, ttlSeconds = 300) {
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(code, salt);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
    return prisma.verificationToken.create({
      data: {
        userId,
        type: 'LOGIN_OTP',
        otpHash,
        token: cryptoToken(),
        expiresAt,
      },
    });
  },
  async verify(tokenId: string, code: string) {
    const record = await prisma.verificationToken.findUnique({
      where: { id: tokenId },
    });
    if (!record) return { ok: false, reason: 'not_found' };
    if (record.usedCount > 0) return { ok: false, reason: 'already_used' };
    if (new Date() > record.expiresAt) return { ok: false, reason: 'expired' };
    const match = await bcrypt.compare(code, record.otpHash || '');
    if (!match) {
      await prisma.verificationToken.update({
        where: { id: tokenId },
        data: { attemptCount: { increment: 1 } },
      });
      return { ok: false, reason: 'invalid_code' };
    }
    // mark used
    await prisma.verificationToken.update({
      where: { id: tokenId },
      data: { verified: true, usedCount: 1, usedAt: new Date() },
    });
    return { ok: true };
  },
};

function cryptoToken() {
  return randomBytes(32).toString('hex');
}
