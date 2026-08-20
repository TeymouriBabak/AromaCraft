import { setTimeout } from 'timers/promises';
import net from 'net';
import { execSync } from 'child_process';

function waitForPort(host: string, port: number, timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function attempt() {
      const socket = new net.Socket();
      socket.setTimeout(2000);
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) return reject(new Error(`Timeout waiting for ${host}:${port}`));
        setTimeout(500).then(attempt);
      });
      socket.once('timeout', () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) return reject(new Error(`Timeout waiting for ${host}:${port}`));
        setTimeout(500).then(attempt);
      });
      socket.connect(port, host, () => {
        socket.end();
        resolve();
      });
    })();
  });
}

export default async function globalSetup() {
  try {
    await waitForPort('127.0.0.1', 6399, 30000);
  } catch (err) {
    throw new Error('Redis not reachable on 127.0.0.1:6399 — run npm run deps:up');
  }

  try {
    // MariaDB port mapping: tests expect 3307 mapped to container 3306
    await waitForPort('127.0.0.1', 3307, 30000);
  } catch (err) {
    throw new Error('MariaDB not reachable on 127.0.0.1:3307 — run npm run deps:up');
  }

  // Ensure Prisma client is generated
  try {
    execSync('npx prisma generate', { stdio: 'ignore' });
  } catch {
    // Ignore; tests will fail if generation is necessary
  }
}
