import { PrismaClient } from '../src/generated/prisma/client';

async function main() {
  const prisma = new PrismaClient();

  try {
    const count = await prisma.session.count();
    console.log('SESSION_COUNT', count);
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
