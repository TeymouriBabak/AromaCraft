import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const user = await prisma.user.findUnique({
  where: { email: 'tbabak@example.com' },
});

console.log('USER_EXISTS:', user ? 'yes' : 'no');
if (user) {
  console.log('USER_ID:', user.id);
  console.log('EMAIL_VERIFIED:', user.emailVerified ? 'yes' : 'no');
}

await prisma.$disconnect();
