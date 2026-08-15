import { randomUUID } from 'crypto';
import { createDbUser } from '../src/lib/db-auth';
import { prisma } from '../src/lib/prisma';

(async function main() {
  const unique = String(Date.now());
  const email = `race-debug-${unique}@example.com`;
  const usernameA = `dbgA_${randomUUID().slice(0, 8)}`;
  const usernameB = `dbgB_${randomUUID().slice(0, 8)}`;

  try {
    console.log('Attempting create A', { email, username: usernameA });
    const a = await createDbUser({
      username: usernameA,
      email,
      password: 'DebugPass!23',
      role: 'customer',
      firstName: 'Dbg',
      lastName: 'A',
      gender: 'Other',
      mobile: '+989111111111',
      countryCode: '+98',
    }).catch((e) => { console.error('create A caught', e); return null; });
    console.log('Result A', a);

    console.log('Attempting create B', { email: email.toUpperCase(), username: usernameB });
    const b = await createDbUser({
      username: usernameB,
      email: email.toUpperCase(),
      password: 'DebugPass!23',
      role: 'customer',
      firstName: 'Dbg',
      lastName: 'B',
      gender: 'Other',
      mobile: '09111111111',
      countryCode: '+98',
    }).catch((e) => { console.error('create B caught', e); return null; });
    console.log('Result B', b);

    const found = await prisma.user.findMany({ where: { email: email.toLowerCase() } });
    console.log('DB found rows for normalized email:', found.length);
    for (const row of found) {
      // eslint-disable-next-line no-console
      console.log('ROW', { id: row.id, email: row.email, username: row.username, mobile: row.mobile });
    }
  } catch (err) {
    console.error('Unhandled error', err);
  } finally {
    await prisma.$disconnect();
  }
})();
