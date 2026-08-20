import 'dotenv/config';
import 'tsconfig-paths/register';

import { test, beforeAll, beforeEach, afterEach } from 'vitest';
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

// Keep console logging enabled so tests surface Redis fallback warnings
// if the Redis client falls back; tests should fail if fallback occurs.

// Suite-wide console capture: collect warn/error messages and allow
// specific tests to opt into expecting fallback messages. Tests must
// explicitly mark `allowFallback = true` when they intentionally
// simulate Redis unavailability.
let captured: string[] = [];
let allowFallback = false;
const FALLBACK_PATTERNS = [/\[redis\].*continuing without Redis/i, /redis unavailable/i, /connection timeout/i, /rate-limit\] Redis unavailable/i];
const origWarn = console.warn;
const origError = console.error;

beforeAll(() => {
  console.warn = (...args: unknown[]) => {
    try { captured.push(String(args.join(' '))); } catch {}
    return (origWarn as (...a: unknown[]) => void)(...args as unknown as unknown[]);
  };
  console.error = (...args: unknown[]) => {
    try { captured.push(String(args.join(' '))); } catch {}
    return (origError as (...a: unknown[]) => void)(...args as unknown as unknown[]);
  };
});

beforeEach(() => {
  captured = [];
  allowFallback = false;
});

afterEach(() => {
  // If the test did not opt-in to expect fallback messages, fail
  // if any captured messages match known fallback patterns.
  const hits = captured.filter(msg => FALLBACK_PATTERNS.some(rx => rx.test(msg)));
  if (!allowFallback && hits.length > 0) {
    // restore originals before throwing to avoid affecting other suites
    console.warn = origWarn;
    console.error = origError;
    throw new Error(`Unexpected Redis fallback logs detected: ${hits.join(' | ')}`);
  }
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
  // This test intentionally simulates a transient connect failure and
  // therefore is allowed to emit Redis fallback logs. Mark it so the
  // suite-wide guard does not fail it, and assert the expected messages
  // are present.
  allowFallback = true;

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
  const hits = captured.filter(msg => FALLBACK_PATTERNS.some(rx => rx.test(msg)));
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
