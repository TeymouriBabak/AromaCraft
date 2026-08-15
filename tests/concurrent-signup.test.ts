import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'crypto';
import { createDbUser } from '../src/lib/db-auth';
import { prisma } from '../src/lib/prisma';

test('concurrent signup with same identifiers yields at most one created user', async () => {
  const unique = String(Date.now());
  const emailA = `race-${unique}@example.com`;
  const emailB = emailA.toUpperCase(); // different case to test normalization
  const uniqueDigits = String(Date.now()).slice(-9);
  const mobileA = `0${uniqueDigits}`;
  const mobileB = `+98${uniqueDigits}`; // different format to test normalization

  const usernameBase = `raceUser${randomUUID().slice(0, 8)}`;

  const p1 = createDbUser({
    username: `${usernameBase}_a`,
    email: emailA,
    password: 'RacePass!23',
    role: 'customer',
    firstName: 'Race',
    lastName: 'One',
    gender: 'Other',
    mobile: mobileA,
    countryCode: '+98',
  });

  const p2 = createDbUser({
    username: `${usernameBase}_b`,
    email: emailB,
    password: 'RacePass!23',
    role: 'customer',
    firstName: 'Race',
    lastName: 'Two',
    gender: 'Other',
    mobile: mobileB,
    countryCode: '+98',
  });

  const [r1, r2] = await Promise.all([p1, p2]);

  // Exactly one should succeed (the other should have returned null due to unique constraint)
  const createdCount = await prisma.user.count({ where: { email: emailA.toLowerCase() } });
  const successCount = Number(r1 !== null) + Number(r2 !== null);
  // At most one create should succeed; database should contain exactly one normalized record
  assert.ok(successCount <= 1, 'Expected at most one create() call to succeed');
  assert.equal(createdCount, 1, 'Expected exactly one user row for the normalized email');
});
