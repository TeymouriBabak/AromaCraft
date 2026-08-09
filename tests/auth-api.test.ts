import test from 'node:test';
import assert from 'node:assert/strict';

import checkUsername from '../src/pages/api/auth/check-username';
import checkEmail from '../src/pages/api/auth/check-email';

function makeMockRes() {
  let statusCode = 200;
  let body: any = null;
  return {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(obj: any) {
      body = obj;
      return { statusCode, body };
    },
    _get() {
      return { statusCode, body };
    },
  } as any;
}

test('check-username returns taken for mock user', async () => {
  const req: any = { method: 'GET', query: { username: 'Tbabak' } };
  const res = makeMockRes();
  // @ts-ignore
  const result = await checkUsername(req, res);
  const out = (res as any)._get();
  assert.equal(out.body.ok, true);
  assert.equal(out.body.data.available, false);
});

test('check-email returns taken for mock email', async () => {
  const req: any = { method: 'GET', query: { email: 'tbabak@example.com' } };
  const res = makeMockRes();
  // @ts-ignore
  const result = await checkEmail(req, res);
  const out = (res as any)._get();
  assert.equal(out.body.ok, true);
  assert.equal(out.body.data.available, false);
});
