import 'dotenv/config';
import 'tsconfig-paths/register';

import { test } from 'vitest';
import assert from 'node:assert/strict';
import type { NextApiRequest, NextApiResponse } from 'next';

import handler from '../src/pages/api/reviews';
import { normalizeCommentDestination, buildCommentTitle } from '../src/lib/review-utils';

type MockResponse = {
  statusCode: number;
  body?: unknown;
  status(code: number): MockResponse;
  json(payload: unknown): MockResponse;
};

test('destination labels normalize to supported home destinations', () => {
  assert.equal(normalizeCommentDestination('home'), 'home');
  assert.equal(normalizeCommentDestination('pike place'), 'pike-place');
  assert.equal(normalizeCommentDestination('PIKE PLACE'), 'pike-place');
});

test('comment titles keep user-facing destination labels concise', () => {
  assert.equal(buildCommentTitle('home'), 'Home');
  assert.equal(buildCommentTitle('pike-place'), 'Pike Place');
});

test('reviews GET is intentionally public storefront read access', async () => {
  const req = {
    method: 'GET',
    headers: {},
    query: {},
  } as unknown as NextApiRequest;

  const res: MockResponse = {
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  await handler(req, res as unknown as NextApiResponse);

  const body = res.body as Record<string, unknown>;
  const data = body.data as Record<string, unknown>;

  assert.equal(res.statusCode, 200);
  assert.equal(body.ok, true);
  assert.ok(Array.isArray(data.reviews));
  assert.ok((data.reviews as unknown[]).length > 0);
});
