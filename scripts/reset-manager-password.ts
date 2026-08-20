import 'dotenv/config';
import { hash } from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  const newPassword = process.env.RESET_MANAGER_PASSWORD ?? 'Manager123!';

  const manager = await prisma.user.findFirst({ where: { role: 'MANAGER' } });
  if (!manager) {
    throw new Error('No MANAGER account found in database');
  }

  const passwordHash = await hash(newPassword, 12);
  await prisma.user.update({
    where: { id: manager.id },
    data: { passwordHash },
  });

  console.log(`Password reset OK -> email: ${manager.email} | username: ${manager.username}`);
}

main()
  .catch((error) => {
    console.error(error?.message ?? error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
