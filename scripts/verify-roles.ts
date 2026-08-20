import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  const byRole: any = await prisma.$queryRawUnsafe("SELECT role, COUNT(*) AS cnt FROM `User` GROUP BY role");
  // serialize BigInt counts
  const byRoleSerialized = (byRole || []).map((r: any) => ({ role: r.role, cnt: typeof r.cnt === 'bigint' ? Number(r.cnt) : r.cnt }));
  console.log('roles:', JSON.stringify(byRoleSerialized, null, 2));

  const managers = await prisma.user.findMany({
    where: { role: 'MANAGER' as any },
    select: { id: true, email: true, username: true, createdAt: true },
  });
  console.log('managers:', JSON.stringify(managers, null, 2));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
