import * as GeneratedPrisma from '../generated/prisma/client';
import { getPrismaClientClass } from '../generated/prisma/internal/class';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import type { PrismaClient as PrismaClientType } from '../generated/prisma/client';

// Provide sensible defaults for local development and test environments
// so the app can run locally without requiring internet or extra env setup.
if (process.env.NODE_ENV !== 'production') {
  if (!process.env.DATABASE_URL) {
    // Default to docker-compose mariadb mapping used in this repo
    process.env.DATABASE_URL = 'mysql://root:root_dev_password@127.0.0.1:3307/aromacraft';
  }
  if (!process.env.REDIS_URL) {
    // Host maps Redis container 6379 -> host 6399 in docker-compose.dev.yml
    process.env.REDIS_URL = 'redis://127.0.0.1:6399';
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

const PrismaCtor = findPrismaConstructor(GeneratedPrisma) ?? ((): PrismaConstructor => {
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
// Startup DB health check: fail fast in production, but in development try retries
// so the app can start while DB containers come up behind it.
if (process.env.NODE_ENV !== 'test') {
  void (async () => {
    const maxRetries = process.env.NODE_ENV === 'production' ? 1 : 5;
    const delayMs = 2000;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        // Try a lightweight query to ensure DB is reachable
        await prisma.$connect();
        // perform a simple query to validate connectivity
        await prisma.$queryRawUnsafe('SELECT 1');
        // connected successfully
        return;
      } catch (err) {
        attempt += 1;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Database connection attempt ${attempt} failed:`, msg);
        if (attempt >= maxRetries) {
          if (process.env.NODE_ENV === 'production') {
            console.error('\nAromacraft startup error: unable to connect to the database.');
            console.error('Details:', msg);
            process.exit(1);
          } else {
            console.error('Dev: giving up after retries. App will continue but DB may be unavailable.');
            console.error('Ensure your database is running and DATABASE_URL is correct.');
            return;
          }
        }
        // wait before retrying
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }
  })();
}
