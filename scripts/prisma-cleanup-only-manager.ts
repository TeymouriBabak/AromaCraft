import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  const managerEmail = process.env.SEED_MANAGER_EMAIL;
  if (!managerEmail) {
    throw new Error('SEED_MANAGER_EMAIL must be set in the environment');
  }

  const manager = await prisma.user.findUnique({ where: { email: managerEmail } });
  if (!manager) {
    throw new Error(`Manager user with email ${managerEmail} not found`);
  }

  // Counts before
  const before = {
    users: await prisma.user.count(),
    sessions: await prisma.session.count(),
    tokens: await prisma.verificationToken.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    activities: await prisma.userActivity.count(),
    reviews: await prisma.review.count(),
  };

  console.log('Counts before cleanup:', before);

  // Find all non-manager user ids
  const others = await prisma.user.findMany({ where: { id: { not: manager.id } }, select: { id: true } });
  const ids = others.map((u) => u.id);

  if (ids.length === 0) {
    console.log('No non-manager users found. Nothing to delete.');
    process.exit(0);
  }

  // Delete dependent rows in safe order
  await prisma.verificationToken.deleteMany({ where: { userId: { in: ids } } });
  await prisma.session.deleteMany({ where: { userId: { in: ids } } });
  await prisma.userActivity.deleteMany({ where: { userId: { in: ids } } });
  await prisma.review.deleteMany({ where: { userId: { in: ids } } });
  // Delete orders (orderItems cascade via schema)
  await prisma.order.deleteMany({ where: { userId: { in: ids } } });

  // Finally delete the users themselves
  const deleted = await prisma.user.deleteMany({ where: { id: { in: ids } } });

  const after = {
    users: await prisma.user.count(),
    sessions: await prisma.session.count(),
    tokens: await prisma.verificationToken.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    activities: await prisma.userActivity.count(),
    reviews: await prisma.review.count(),
  };

  console.log('Deleted users count:', deleted.count);
  console.log('Counts after cleanup:', after);
}

main()
  .catch((err) => {
    console.error('Cleanup error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
