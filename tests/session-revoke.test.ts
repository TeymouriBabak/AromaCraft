import 'dotenv/config';
import 'tsconfig-paths/register';

import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createDbUser, createDbSession, getSessionByCookieValue, deleteSessionByCookieValue } from '../src/lib/db-auth';

test('session revocation prevents subsequent access', async () => {
  const user = await createDbUser({
    username: `sessrev_${Date.now()}`,
    email: `sessrev_${Date.now()}@example.com`,
    password: 'SessionRev!23',
    role: 'customer',
    firstName: 'Sess',
    lastName: 'Rev',
    gender: 'Other',
    mobile: `+1415${String(Date.now() % 100000).padStart(5,'0')}`,
    countryCode: '+1',
  });
  if (!user) throw new Error('create user failed');

  const dbSession = await createDbSession(user.id, 60);
  const fetched = await getSessionByCookieValue(dbSession.token);
  assert.ok(fetched && fetched.session && fetched.user);

  const deleted = await deleteSessionByCookieValue(dbSession.token);
  assert.equal(deleted, true);

  const after = await getSessionByCookieValue(dbSession.token);
  assert.equal(after, null);
});
