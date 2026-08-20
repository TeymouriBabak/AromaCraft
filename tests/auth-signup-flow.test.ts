import 'dotenv/config';
import 'tsconfig-paths/register';

import { test } from 'vitest';
import assert from 'node:assert/strict';

import {
  isPhoneNumberValid,
  normalizePhoneNumber,
  signupSchema,
  loginSchema,
  isSignupFormReady,
} from '../src/lib/auth-validation';

test('signup form is disabled when required fields are empty', () => {
  const ready = isSignupFormReady({
    firstName: '',
    lastName: '',
    gender: '',
    username: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  assert.equal(ready, false);
});

test('signup form is enabled when all valid required fields are filled', () => {
  const ready = isSignupFormReady({
    firstName: 'Ava',
    lastName: 'Morgan',
    gender: 'Female',
    username: 'AvaM0rgan',
    mobile: '+1 (415) 555-0188',
    email: 'ava@example.com',
    password: 'Coffee!2024',
    confirmPassword: 'Coffee!2024',
  });

  assert.equal(ready, true);
});

test('invalid phone numbers are rejected with a field-level validation error', () => {
  const result = signupSchema.safeParse({
    firstName: 'Ava',
    lastName: 'Morgan',
    gender: 'Female',
    username: 'AvaM0rgan',
    mobile: '123',
    email: 'ava@example.com',
    password: 'Coffee!2024',
    confirmPassword: 'Coffee!2024',
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues.some((issue) => issue.path.includes('mobile')), true);
});

test('valid phone numbers use the same client and server normalization rules', () => {
  const value = '+1 (415) 555-0188';
  const normalized = normalizePhoneNumber(value);

  assert.equal(normalized, '+14155550188');
  assert.equal(isPhoneNumberValid(value), true);
  assert.equal(signupSchema.safeParse({
    firstName: 'Ava',
    lastName: 'Morgan',
    gender: 'Female',
    username: 'AvaM0rgan',
    mobile: value,
    email: 'ava@example.com',
    password: 'Coffee!2024',
    confirmPassword: 'Coffee!2024',
  }).success, true);
});

test('login and signup schemas remain independent', () => {
  const loginResult = loginSchema.safeParse({
    loginMode: 'email',
    role: 'customer',
    identifier: 'ava@example.com',
    password: 'Coffee!2024',
  });

  const signupResult = signupSchema.safeParse({
    firstName: 'Ava',
    lastName: 'Morgan',
    gender: 'Female',
    username: 'AvaM0rgan',
    mobile: '+14155550188',
    email: 'ava@example.com',
    password: 'Coffee!2024',
    confirmPassword: 'Coffee!2024',
  });

  assert.equal(loginResult.success, true);
  assert.equal(signupResult.success, true);
});
