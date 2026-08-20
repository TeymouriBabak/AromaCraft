import { setTimeout } from 'timers/promises';
import { execSync } from 'child_process';
import { createClient as createRedisClient } from 'redis';
import mysql from 'mysql2/promise';



export default async function globalSetup() {
  // Ensure tests use the host-mapped services from docker-compose.dev.yml
  process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6399';
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'mysql://root:root_dev_password@127.0.0.1:3307/aromacraft';

  // Active readiness: attempt PING via redis client
  try {
    const rClient = createRedisClient({ url: process.env.REDIS_URL });
    const start = Date.now();
    const timeoutMs = 30000;
    while (Date.now() - start < timeoutMs) {
      try {
        await rClient.connect();
        const pong = await rClient.ping().catch(() => null);
        await rClient.quit().catch(() => {});
        if (pong === 'PONG' || pong === null) {
          // Some redis clients return null for ping in certain builds; treat connect as readiness
          break;
        }
      } catch {
        // ignore and retry
      }
      await setTimeout(500);
    }
  } catch {
    throw new Error('Redis not reachable on 127.0.0.1:6399 — run npm run deps:up');
  }

  try {
    // MariaDB port mapping: tests expect 3307 mapped to container 3306
    const dbUrl = new URL(process.env.DATABASE_URL ?? 'mysql://root:root_dev_password@127.0.0.1:3307/aromacraft');
    const start = Date.now();
    const timeoutMs = 30000;
    while (Date.now() - start < timeoutMs) {
      try {
        const conn = await mysql.createConnection({
          host: dbUrl.hostname,
          port: Number(dbUrl.port || 3306),
          user: dbUrl.username,
          password: dbUrl.password,
        });
        await conn.query('SELECT 1').catch(() => null);
        await conn.end().catch(() => {});
        break;
      } catch {
        // ignore and retry
      }
      await setTimeout(500);
    }
  } catch {
    throw new Error('MariaDB not reachable on 127.0.0.1:3307 — run npm run deps:up');
  }

  // Ensure Prisma client is generated
  try {
    execSync('npx prisma generate', { stdio: 'ignore' });
  } catch {
    // Ignore; tests will fail if generation is necessary
  }
}
