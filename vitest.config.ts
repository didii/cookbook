import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'scripts/spec-check.test.ts'],
    // TODO: remove the raised timeouts once the database is set up in a global step instead of per test.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
