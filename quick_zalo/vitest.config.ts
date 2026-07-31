import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup/test-setup.ts'],
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['tests/e2e-playwright/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@config': resolve(__dirname, 'src/config'),
      '@domain': resolve(__dirname, 'src/domain'),
      '@app': resolve(__dirname, 'src/app'),
      '@infra': resolve(__dirname, 'src/infra'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@features': resolve(__dirname, 'src/features'),
      '@composition': resolve(__dirname, 'src/composition'),
    },
  },
});
