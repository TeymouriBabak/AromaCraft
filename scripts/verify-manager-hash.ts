import 'dotenv/config';
import { compare } from 'bcryptjs';
import { prisma } from '../src/lib/prisma';

async function main() {
  const email = process.env.SEED_MANAGER_EMAIL;
  const password = process.env.SEED_MANAGER_PASSWORD;
  if (!email || !password) {
    throw new Error('SEED_MANAGER_EMAIL and SEED_MANAGER_PASSWORD must be set');
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error('Manager user not found');
    process.exit(2);
  }

  const ok = await compare(password, user.passwordHash);
  console.log('password match:', ok);
}

main()
  .catch((err) => {
    console.error('error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
