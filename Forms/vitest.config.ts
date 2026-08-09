import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineConfig({
  plugins: [WxtVitest()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/unit/**/*.{test,spec}.ts', 'tests/contract/**/*.{test,spec}.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**', '.output/**', '.wxt/**'],
    coverage: {
      provider: 'v8',
      include: ['src/3_modules/**'],
      thresholds: { lines: 90, functions: 90, statements: 90, branches: 80 },
      reporter: ['text', 'text-summary', 'html'],
    },
  },
});
