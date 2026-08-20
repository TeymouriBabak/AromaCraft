import { initRedis } from '../src/lib/redis';

async function main() {
  const redis = await initRedis();
  if (!redis) {
    console.log('Redis not available; nothing to clear');
    return;
  }

  const patterns = ['login:*', 'signup:*', 'resend:*', 'ratelimit:*'];
  for (const pat of patterns) {
    try {
      const keys = await redis.keys(pat);
      if (keys.length === 0) {
        console.log(`No keys for pattern ${pat}`);
        continue;
      }
      console.log(`Deleting ${keys.length} keys for pattern ${pat}`);
      for (const k of keys) {
        await redis.del(k);
      }
    } catch (err) {
      console.error('Error clearing pattern', pat, err);
    }
  }

  try {
    await redis.quit();
  } catch {
    // ignore
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
