import 'dotenv/config';
import 'tsconfig-paths/register';

import forgotPassword from '../src/pages/api/auth/forgot-password';

function makeMockRes() {
  let statusCode = 200;
  let body: unknown = null;
  const headers: Record<string, string | string[] | undefined> = {};
  return {
    status(code: number) { statusCode = code; return this; },
    json(obj: unknown) { body = obj; return { statusCode, body }; },
    setHeader(name: string, value: string | string[]) { headers[name] = value; return this; },
    getHeader(name: string) { return headers[name]; },
    _get() { return { statusCode, body, headers }; },
  } as any;
}

async function run() {
  const email = 'tbabak@example.com';
  const req = { method: 'POST', body: { email } } as any;
  const res = makeMockRes();

  const calls: Array<{ method: string; text: string }> = [];
  const orig = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: (console as any).debug,
  };

  console.log = (...args: unknown[]) => { calls.push({ method: 'log', text: args.map(a => String(a)).join(' ') }); };
  console.info = (...args: unknown[]) => { calls.push({ method: 'info', text: args.map(a => String(a)).join(' ') }); };
  console.warn = (...args: unknown[]) => { calls.push({ method: 'warn', text: args.map(a => String(a)).join(' ') }); };
  console.error = (...args: unknown[]) => { calls.push({ method: 'error', text: args.map(a => String(a)).join(' ') }); };
  if (typeof orig.debug === 'function') (console as any).debug = (...args: unknown[]) => { calls.push({ method: 'debug', text: args.map(a => String(a)).join(' ') }); };

  try {
    await (forgotPassword as any)(req, res);
  } finally {
    console.log = orig.log;
    console.info = orig.info;
    console.warn = orig.warn;
    console.error = orig.error;
    if (typeof orig.debug === 'function') (console as any).debug = orig.debug;
  }

  console.log('Console calls during forgot-password:');
  for (const c of calls) {
    console.log(`${c.method}: ${c.text}`);
  }
}

run().catch(e => { console.error(e); process.exit(1); });
