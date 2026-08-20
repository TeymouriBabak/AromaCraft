import * as GeneratedPrisma from '../generated/prisma/client';
import * as GeneratedPrismaIndex from '../generated/prisma/index.js';
import { getPrismaClientClass } from '../generated/prisma/internal/class';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import type { PrismaClient as PrismaClientType } from '../generated/prisma/client';

// Provide sensible defaults for test environment when running locally
if (process.env.NODE_ENV === 'test' || process.env.npm_lifecycle_event === 'test') {
  if (!process.env.DATABASE_URL) {
    // Default to docker-compose mariadb mapping used in this repo
    process.env.DATABASE_URL = 'mysql://root:root_dev_password@127.0.0.1:3307/aromacraft';
  }
  if (!process.env.REDIS_URL) {
    process.env.REDIS_URL = 'redis://127.0.0.1:6379';
  }
}

type PrismaConstructor = new (...args: unknown[]) => PrismaClientType;

function findPrismaConstructor(gen: unknown): PrismaConstructor | null {
  if (!gen) return null;
  // gen may be a constructor function itself
  if (typeof gen === 'function') return gen as unknown as PrismaConstructor;

  // treat as record for property introspection
  const rec = gen as Record<string, unknown>;
  if (rec.PrismaClient && typeof rec.PrismaClient === 'function') {
    return rec.PrismaClient as unknown as new (...args: unknown[]) => PrismaClientType;
  }
  if (rec.default) {
    const d = rec.default as unknown;
    if (typeof d === 'function') return d as unknown as new (...args: unknown[]) => PrismaClientType;
    if (typeof (d as Record<string, unknown>).PrismaClient === 'function') {
      return (d as Record<string, unknown>).PrismaClient as unknown as new (...args: unknown[]) => PrismaClientType;
    }
  }

  // Some bundlers wrap exports under nested `default` or `module.exports` properties.
  const maybeNested = (rec.default as unknown as Record<string, unknown> | undefined) ?? (rec as Record<string, unknown>);
  if (maybeNested) {
    const nestedDefault = (maybeNested as Record<string, unknown>)?.default as unknown;
    if (nestedDefault && typeof (nestedDefault as Record<string, unknown>).PrismaClient === 'function') {
      return (nestedDefault as Record<string, unknown>).PrismaClient as unknown as new (...args: unknown[]) => PrismaClientType;
    }
    const nestedModuleExports = (maybeNested as Record<string, unknown>)?.['module.exports'] as unknown;
    if (nestedModuleExports && typeof (nestedModuleExports as Record<string, unknown>).PrismaClient === 'function') {
      return (nestedModuleExports as Record<string, unknown>).PrismaClient as unknown as new (...args: unknown[]) => PrismaClientType;
    }
  }

  // Final fallback: scan object properties (shallow) for a likely PrismaClient constructor.
  const seen = new Set<unknown>();
  function scan(obj: unknown, depth = 0): PrismaConstructor | null {
    if (!obj || depth > 2 || seen.has(obj)) return null;
    seen.add(obj);
    if (typeof obj === 'function') {
      const fnLike = obj as unknown as { name?: string; prototype?: Record<string, unknown> };
      if (fnLike.name === 'PrismaClient') return obj as unknown as PrismaConstructor;
      const proto = fnLike.prototype;
      if (proto && typeof proto.connect === 'function') return obj as unknown as PrismaConstructor;
    }
    if (typeof obj === 'object') {
      for (const key of Object.keys(obj as Record<string, unknown>)) {
        try {
          const val = (obj as Record<string, unknown>)[key];
          const found = scan(val, depth + 1);
          if (found) return found;
        } catch {
          // ignore property access errors
        }
      }
    }
    return null;
  }

  const scanned = scan(rec) ?? scan((rec as Record<string, unknown>).default) ?? scan((rec as Record<string, unknown>)['module.exports']);
  if (scanned) return scanned;

  for (const key of Object.keys(rec)) {
    const v = rec[key];
    if (v && typeof (v as Record<string, unknown>).PrismaClient === 'function') {
      return (v as Record<string, unknown>).PrismaClient as unknown as PrismaConstructor;
    }
    if (typeof v === 'function') return v as unknown as PrismaConstructor;
  }
  return null;
}

const PrismaCtor = findPrismaConstructor(GeneratedPrisma) ?? findPrismaConstructor(GeneratedPrismaIndex) ?? ((): PrismaConstructor => {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  return getPrismaClientClass(dirname) as unknown as PrismaConstructor;
})();
if (!PrismaCtor) {
  throw new Error('Unable to locate a PrismaClient constructor from generated client');
}

type PrismaClientInstance = PrismaClientType;

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClientInstance;
};

export const prisma = globalForPrisma.prisma ?? new PrismaCtor();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Startup DB health check: fail fast when the app boots in dev/production
// Tests should skip the health check when NODE_ENV=test
if (process.env.NODE_ENV !== 'test') {
  void (async () => {
    try {
      // Try a lightweight query to ensure DB is reachable
      await prisma.$connect();
      // perform a simple query to validate connectivity
      await prisma.$queryRawUnsafe('SELECT 1');
      // keep connection open for reuse
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Provide a clear failure message and exit to fail fast
      // Avoid stack traces which may leak secrets
      console.error('\nAromacraft startup error: unable to connect to the database.');
      console.error('Details:', msg);
      // In dev, suggest common fixes
      if (process.env.NODE_ENV !== 'production') {
        console.error('Ensure your database is running and DATABASE_URL is correct.');
      }
      // Exit with non-zero code so process managers notice the failure
      process.exit(1);
    }
  })();
}
