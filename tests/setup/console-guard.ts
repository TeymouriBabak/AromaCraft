import { beforeAll, beforeEach, afterEach } from 'vitest';

// Suite-wide console capture for Redis fallback detection
const FALLBACK_PATTERNS = [/\[redis\].*continuing without Redis/i, /redis unavailable/i, /connection timeout/i, /rate-limit\] Redis unavailable/i];
const origWarn = console.warn;
const origError = console.error;
let captured: string[] = [];

// Expose an opt-in flag on globalThis for tests that intentionally
// simulate Redis unavailability.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      __allowRedisFallback?: boolean;
    }
  }
}

export function allowRedisFallback() {
  const G = globalThis as unknown as { __allowRedisFallback?: boolean };
  G.__allowRedisFallback = true;
}

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
  const G = globalThis as unknown as { __allowRedisFallback?: boolean };
  G.__allowRedisFallback = false;
});

afterEach(() => {
  const G = globalThis as unknown as { __allowRedisFallback?: boolean };
  const allow = Boolean(G.__allowRedisFallback);
  const hits = captured.filter(msg => FALLBACK_PATTERNS.some(rx => rx.test(msg)));
  if (!allow && hits.length > 0) {
    // restore originals before failing
    console.warn = origWarn;
    console.error = origError;
    throw new Error(`Unexpected Redis fallback logs detected: ${hits.join(' | ')}`);
  }
});

// Also export a helper to inspect captured messages in tests, if needed.
export function getCapturedConsoleMessages() {
  return captured.slice();
}
