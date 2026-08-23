// Import the generated Prisma client directly to avoid resolution issues
const { PrismaClient } = require('../src/generated/prisma/client');

const prisma = new PrismaClient();

async function main() {
  const cntOld = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
  const managers = await prisma.user.findMany({
    where: { role: 'MANAGER' },
    select: { id: true, email: true, role: true },
    take: 20,
  });
  console.log(JSON.stringify({ cntOld, managers }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
