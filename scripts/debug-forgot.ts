import 'dotenv/config';
import 'tsconfig-paths/register';

import forgotPassword from '../src/pages/api/auth/forgot-password';

function makeMockRes() {
  let statusCode = 200;
  let body: unknown = null;
  const headers: Record<string, string | string[] | undefined> = {};
  return {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(obj: unknown) {
      body = obj;
      return { statusCode, body };
    },
    setHeader(name: string, value: string | string[]) {
      headers[name] = value;
      return this;
    },
    getHeader(name: string) {
      return headers[name];
    },
    _get() {
      return { statusCode, body, headers };
    },
  } as any;
}

async function main() {
  const email = 'tbabak@example.com';
  const req = { method: 'POST', body: { email } } as any;
  const res = makeMockRes();

  const captured: string[] = [];
  const origLog = console.log;
  const origInfo = console.info;
  console.log = (...args: unknown[]) => {
    captured.push(args.map((a) => String(a)).join(' '));
  };
  console.info = (...args: unknown[]) => {
    captured.push(args.map((a) => String(a)).join(' '));
  };

  try {
    await (forgotPassword as any)(req, res);
  } catch (e) {
    console.error('handler error', e);
  } finally {
    console.log = origLog;
    console.info = origInfo;
  }

  console.log('Captured logs:\n', captured.join('\n'));
  console.log('Response:', res._get());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
