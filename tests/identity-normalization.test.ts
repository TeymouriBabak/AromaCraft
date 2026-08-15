import test from 'node:test';
import assert from 'node:assert/strict';
import { createDbUser, findUserByMobile } from '../src/lib/db-auth';
import { normalizePhoneNumber } from '../src/lib/auth-validation';
import { randomUUID } from 'crypto';

test('mobile normalization and uniqueness for Iranian numbers', async () => {
  const mobileVariants = ['09123456789', '+98 912 345 6789', '0098-912-345-6789'];
  const uuid = randomUUID();
  const usernameBase = `user_${uuid}`;
  const emailBase = `test_${uuid}@example.com`;

  // Create first user with local-format mobile
  const user = await createDbUser({
    username: `${usernameBase}_a`,
    email: `${emailBase}`,
    password: 'Aa1!password',
    firstName: 'Test',
    lastName: 'User',
    gender: 'other',
    mobile: mobileVariants[0],
    countryCode: null,
  });
  assert.ok(user && user.id, 'First user should be created');

  // Normalized canonical form
  const canonical = normalizePhoneNumber(mobileVariants[0]);
  assert.ok(canonical && canonical.startsWith('+98'), 'Canonical should be +98 variant');

  // find by alternative variant should resolve to the same user
  const found = await findUserByMobile(mobileVariants[1]);
  assert.ok(found && found.id === user.id, 'findUserByMobile should locate the created user from another variant');

  // Attempt to create another user with a different username/email but same mobile (alternate format)
  const user2 = await createDbUser({
    username: `${usernameBase}_b`,
    email: `${emailBase.replace('@', '+2@')}`,
    password: 'Bb2!password',
    firstName: 'Test',
    lastName: 'User2',
    gender: 'other',
    mobile: mobileVariants[2],
    countryCode: null,
  });

  // Creation should fail due to unique constraint on normalized mobile
  assert.equal(user2, null, 'Second user creation should return null due to mobile uniqueness conflict');
});
