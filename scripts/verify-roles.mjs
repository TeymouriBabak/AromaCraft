import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

(async () => {
  try {
    const byRole = await prisma.$queryRaw`SELECT role, COUNT(*) AS cnt FROM \`User\` GROUP BY role`;
    console.log('roles:', JSON.stringify(byRole, null, 2));

    const managers = await prisma.user.findMany({
      where: { role: 'MANAGER' },
      select: { id: true, email: true, username: true, createdAt: true },
    });
    console.log('managers:', JSON.stringify(managers, null, 2));
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
