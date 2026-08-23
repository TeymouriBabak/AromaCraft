import 'dotenv/config';
import 'tsconfig-paths/register';

import assert from 'node:assert/strict';
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

async function run() {
  const email = 'tbabak@example.com';
  const req = { method: 'POST', body: { email } } as any;
  const res = makeMockRes();

  const originalLog = console.log;
  const originalInfo = console.info;
  const captured: string[] = [];
  const capture = (...args: unknown[]) => {
    captured.push(args.map((a) => String(a)).join(' '));
  };
  try {
    console.log = capture;
    console.info = capture;

    const { checkRateLimit } = await import('../src/lib/redis');
    const rl = await checkRateLimit('fail-closed:test', 1, 60);
    console.log('checkRateLimit returned:', rl);
    try {
      assert.strictEqual(
        rl,
        false,
        `Expected checkRateLimit(...) to be false but got ${String(rl)}`
      );
    } catch (e) {
      console.error(
        'Rate limit assertion failed:',
        e instanceof Error ? e.message : String(e)
      );
    }

    await (forgotPassword as any)(req, res);
    const out = res._get();
    const body = out.body as Record<string, unknown>;
    const payload = body.data as Record<string, unknown>;
    const message = String(payload?.message ?? '');

    console.log('response body ok=', Boolean(body.ok));
    console.log('message=', message);

    // Assertions from test
    const failures: string[] = [];
    if (body.ok !== true)
      failures.push(`body.ok expected true but was ${String(body.ok)}`);
    if (typeof message !== 'string')
      failures.push(`message expected string but was ${typeof message}`);
    if (message.includes(email))
      failures.push(`message includes email (${email})`);
    if (/token/i.test(message)) failures.push(`message includes 'token'`);
    if (
      /reset[-_ ]?link|\/reset|\?.*token=|token=|expires|expiry/i.test(message)
    )
      failures.push('message includes reset-link or token query');

    const consoleText = captured.join(' ');
    if (consoleText.includes(email))
      failures.push(`console output includes email (${email})`);
    if (/token/i.test(consoleText))
      failures.push(`console output includes 'token'`);
    if (
      /reset[-_ ]?link|\/reset|\?.*token=|token=|expires|expiry/i.test(
        consoleText
      )
    )
      failures.push('console output includes reset-link or token query');

    console.log('\nCaptured console lines:\n', consoleText || '<none>');
    if (failures.length) {
      console.error('\nTest repro failures:\n', failures.join('\n'));
      process.exitCode = 2;
    } else {
      console.log('\nAll checks passed');
    }
  } finally {
    console.log = originalLog;
    console.info = originalInfo;
  }
}

run().catch((e) => {
  console.error('run error', e);
  process.exit(1);
});
