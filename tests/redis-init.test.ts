import 'dotenv/config';
import 'tsconfig-paths/register';

import { test } from 'vitest';
import { allowRedisFallback, getCapturedConsoleMessages } from './setup/console-guard';
import assert from 'node:assert/strict';

import * as redisModule from '../src/lib/redis';

type MockRedis = {
  isOpen?: boolean;
  connect(): Promise<void>;
  on(event: string, fn: (err: unknown) => void): void;
  off?(event: string, fn: (err: unknown) => void): void;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  get?(key: string): Promise<string | null>;
  del?(): Promise<number>;
  quit(): Promise<void>;
};

// Helper: reset module state between tests
async function resetState() {
  try { await redisModule.closeRedis(); } catch {}
  // restore factory to real impl
  const { createClient } = await import('redis');
  redisModule.setCreateRedisClient(createClient);
  // reset internal flags so a simulated failure doesn't leak between tests
  const maybe = redisModule as unknown as { resetRedisTestState?: () => void };
  if (typeof maybe.resetRedisTestState === 'function') maybe.resetRedisTestState();
}

// Shared console guard lives in tests/setup/console-guard.ts

test('checkRateLimit initializes Redis lazily on first call', async () => {
  await resetState();

  // Simple mock client
  const store = new Map<string, number>();
  const mockClient: MockRedis = {
    isOpen: false,
    async connect() { mockClient.isOpen = true; },
    on() {},
    off() {},
    async incr(k: string) { const v = (store.get(k) || 0) + 1; store.set(k, v); return v; },
    async expire() { return 1; },
    async get(k: string) { return String(store.get(k) || 0); },
    async del() { return 1; },
    async quit() { mockClient.isOpen = false; }
  };

  redisModule.setCreateRedisClient(() => mockClient);

  const allowed = await redisModule.checkRateLimit('test:1', 5, 60);
  assert.equal(allowed, true);
});

test('concurrent initializations share a single attempt', async () => {
  await resetState();

  let created = 0;
  const store = new Map<string, number>();

  const factory = () => {
    created += 1;
    const client: MockRedis = {
      isOpen: false,
      async connect() { await new Promise(r => setTimeout(r, 20)); client.isOpen = true; },
      on() {},
      off() {},
      async incr(k: string) { const v = (store.get(k) || 0) + 1; store.set(k, v); return v; },
      async expire() { return 1; },
      async quit() { client.isOpen = false; }
    };
    return client;
  };
  redisModule.setCreateRedisClient(factory);

  const p1 = redisModule.checkRateLimit('c:1', 5, 60);
  const p2 = redisModule.checkRateLimit('c:1', 5, 60);
  const [r1, r2] = await Promise.all([p1, p2]);
  assert.equal(r1, true);
  assert.equal(r2, true);
  assert.equal(created, 1, 'Factory should be called only once');
});

test('failed connection remains fail-closed and allows retry later', async () => {
  await resetState();
  // This test intentionally simulates a transient connect failure and
  // therefore is allowed to emit Redis fallback logs.
  allowRedisFallback();

  let attempts = 0;
  const factory = () => {
    attempts += 1;
    const client: MockRedis = {
      isOpen: false,
      on() {},
      off() {},
      async connect() { if (attempts === 1) throw new Error('connect-fail'); client.isOpen = true; },
      async incr() { return 1; },
      async expire() { return 1; },
      async quit() { client.isOpen = false; }
    };
    return client;
  };
  redisModule.setCreateRedisClient(factory);

  const first = await redisModule.checkRateLimit('r:1', 5, 60);
  assert.equal(first, false, 'Should be fail-closed on first failed init');

  // Ensure no Redis fallback warning was emitted to console
  // (this test suite expects a real Redis; warnings indicate fallback behavior)

  // Retry should attempt to initialize again and succeed
  const second = await redisModule.checkRateLimit('r:1', 5, 60);
  assert.equal(second, true, 'Should succeed after retry');
  assert.equal(attempts >= 2, true);

  // Assert that expected fallback messages were emitted
  const hits = getCapturedConsoleMessages().filter(s => /continuing without Redis/i.test(s) || /Redis unavailable/i.test(s) || /connection timeout/i.test(s) || /rate-limit\] Redis unavailable/i.test(s));
  if (hits.length === 0) {
    throw new Error('Expected Redis fallback logs during simulated failure, but none were captured');
  }
});

test('stale/closed client is not treated as healthy', async () => {
  await resetState();

  const store = new Map<string, number>();
  const clientA: MockRedis = {
    isOpen: true,
    async connect() { clientA.isOpen = true; },
    on() {},
    off() {},
    async incr(k: string) { const v = (store.get(k) || 0) + 1; store.set(k, v); return v; },
    async expire() { return 1; },
    async quit() { clientA.isOpen = false; }
  };

  // First factory returns a client that is already open but will be closed later
  redisModule.setCreateRedisClient(() => ({ ...clientA }));
  const ok = await redisModule.checkRateLimit('s:1', 5, 60);
  assert.equal(ok, true);

  // Simulate client closed by external factors
  await redisModule.closeRedis();

  // Next factory returns a fresh client
  redisModule.setCreateRedisClient(function() {
    const c: MockRedis = {
      isOpen: false,
      async connect() { c.isOpen = true; },
      on() {},
      off() {},
      async incr(k: string) { const v = (store.get(k) || 0) + 1; store.set(k, v); return v; },
      async expire() { return 1; },
      async quit() { c.isOpen = false; }
    };
    return c;
  });

  const ok2 = await redisModule.checkRateLimit('s:1', 5, 60);
  assert.equal(ok2, true);
});
