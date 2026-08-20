import 'dotenv/config';
import { hash } from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_MANAGER_EMAIL;
  const username = process.env.SEED_MANAGER_USERNAME;
  const password = process.env.SEED_MANAGER_PASSWORD;

  if (!email || !username || !password) {
    throw new Error('SEED_MANAGER_EMAIL, SEED_MANAGER_USERNAME and SEED_MANAGER_PASSWORD must be set to create the initial MANAGER account');
  }

  // Hash the password with bcrypt (same as signup flow)
  const passwordHash = await hash(password, 12);

  // Upsert by email to ensure idempotency
  await prisma.user.upsert({
    where: { email },
    update: {
      username,
      role: 'MANAGER',
      passwordHash,
    },
    create: {
      email,
      username,
      passwordHash,
      role: 'MANAGER',
    },
  });
}

main()
  .catch((error) => {
    console.error(error?.message ?? error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
