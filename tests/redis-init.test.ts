import 'dotenv/config';
import 'tsconfig-paths/register';

import { test, beforeEach, afterEach } from 'vitest';
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
}

// Silence noisy Redis fallback warnings during these unit tests so test
// output remains clean when running the full suite with real services.
let _origWarn: typeof console.warn;
let _origError: typeof console.error;
let _origLog: typeof console.log;
beforeEach(() => {
  _origWarn = console.warn;
  _origError = console.error;
  _origLog = console.log;
  const _noop = () => {};
  console.warn = _noop as unknown as typeof console.warn;
  console.error = _noop as unknown as typeof console.error;
  console.log = _noop as unknown as typeof console.log;
});
afterEach(() => {
  console.warn = _origWarn;
  console.error = _origError;
  console.log = _origLog;
});

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

  // Retry should attempt to initialize again and succeed
  const second = await redisModule.checkRateLimit('r:1', 5, 60);
  assert.equal(second, true, 'Should succeed after retry');
  assert.equal(attempts >= 2, true);
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
