import 'dotenv/config';
import 'tsconfig-paths/register';

import { test } from 'vitest';
import assert from 'node:assert/strict';
import { isPhoneNumberValid, normalizePhoneNumber } from '../src/lib/auth-validation';

type Case = { input: string; valid: boolean; normalized?: string };

const cases: Case[] = [
  { input: '+14155552671', valid: true, normalized: '+14155552671' },
  { input: '+447911123456', valid: true, normalized: '+447911123456' },
  { input: '09123456789', valid: true, normalized: '+989123456789' },
  { input: '+989123456789', valid: true, normalized: '+989123456789' },
  { input: '12345', valid: false },
  { input: '+1', valid: false },
];

test('phone validation and normalization', () => {
  for (const c of cases) {
    const ok = isPhoneNumberValid(c.input);
  
    assert.strictEqual(ok, c.valid, `Validity mismatch for ${c.input}`);
    if (c.valid && c.normalized) {
      const norm = normalizePhoneNumber(c.input);
      
      assert.strictEqual(norm, c.normalized, `Normalization mismatch for ${c.input}: got ${norm}`);
    }
  }
});
