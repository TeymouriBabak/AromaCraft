import { PrismaClient } from '../src/generated/prisma/client.ts';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();
  const passwordHash = await hash('Teymouribabak78#', 12);
  const user = await prisma.user.upsert({
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

  console.log(JSON.stringify({ id: user.id, email: user.email, username: user.username, role: user.role }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
