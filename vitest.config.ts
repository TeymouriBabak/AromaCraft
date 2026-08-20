// Use runtime requires so `npx vitest` can install deps on demand.
let defineConfig: any = (c: any) => c;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  defineConfig = require('vitest/config').defineConfig;
} catch {
  // fall back to identity
}

let tsconfigPathsPlugin: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  tsconfigPathsPlugin = require('vite-tsconfig-paths');
  // handle ESM default export shape
  if (tsconfigPathsPlugin && typeof tsconfigPathsPlugin.default === 'function') {
    tsconfigPathsPlugin = tsconfigPathsPlugin.default;
  }
} catch {
  tsconfigPathsPlugin = null;
}

const plugins = tsconfigPathsPlugin ? [tsconfigPathsPlugin()] : [];

// Provide a simple alias fallback so `@/` imports resolve even without the
// `vite-tsconfig-paths` plugin being installed in the environment.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
const alias = { '@': path.resolve(__dirname, 'src') };

module.exports = defineConfig({
  plugins,
  resolve: { alias },
  server: {
    deps: {
      inline: ['@prisma/client', '.prisma/client'],
    },
  },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['dotenv/config'],
    globalSetup: 'tests/setup/global-setup.ts',
    // If Prisma still causes interop issues, run tests in a single worker
    threads: false,
    isolate: true,
  },
});
