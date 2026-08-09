import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeCommentDestination, buildCommentTitle } from '../src/lib/review-utils';

test('destination labels normalize to supported home destinations', () => {
  assert.equal(normalizeCommentDestination('home'), 'home');
  assert.equal(normalizeCommentDestination('pike place'), 'pike-place');
  assert.equal(normalizeCommentDestination('PIKE PLACE'), 'pike-place');
});

test('comment titles keep user-facing destination labels concise', () => {
  assert.equal(buildCommentTitle('home'), 'Home');
  assert.equal(buildCommentTitle('pike-place'), 'Pike Place');
});
