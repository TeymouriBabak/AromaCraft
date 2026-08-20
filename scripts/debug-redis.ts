import 'dotenv/config';
import 'tsconfig-paths/register';

async function main() {
  const captured: string[] = [];
  const origWarn = console.warn;
  const origLog = console.log;
  const origInfo = console.info;
  console.log = (...args: unknown[]) => { captured.push(args.map(a => String(a)).join(' ')); };
  console.info = (...args: unknown[]) => { captured.push(args.map(a => String(a)).join(' ')); };
  console.warn = (...args: unknown[]) => { captured.push(args.map(a => String(a)).join(' ')); };

  try {
    const { checkRateLimit } = await import('../src/lib/redis');
    const allowed = await checkRateLimit('fail-closed:test', 1, 60);
    console.log('allowed:', allowed);
  } catch (e) {
    console.error('err', e);
  } finally {
    console.log = origLog;
    console.info = origInfo;
    console.warn = origWarn;
  }

  console.log('Captured logs:\n', captured.join('\n'));
}

main().catch((e) => { console.error(e); process.exit(1); });
