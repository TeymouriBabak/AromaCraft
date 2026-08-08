import 'dotenv/config';
import { hash } from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash('Teymouribabak78#', 12);

  await prisma.user.upsert({
    where: { email: 'tbabak@example.com' },
    update: {
      username: 'Tbabak',
      name: 'Babak Teymouri',
      firstName: 'Babak',
      lastName: 'Teymouri',
      role: 'CUSTOMER',
      passwordHash,
    },
    create: {
      username: 'Tbabak',
      email: 'tbabak@example.com',
      passwordHash,
      role: 'CUSTOMER',
      name: 'Babak Teymouri',
      firstName: 'Babak',
      lastName: 'Teymouri',
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
