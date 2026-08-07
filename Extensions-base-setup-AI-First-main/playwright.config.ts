import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E (ARCH-E2E-001) — load extension build THẬT với Persistent Chrome Context.
 * testDir giới hạn tests/e2e — Playwright KHÔNG được nuốt spec Vitest.
 * Build extension trước (pnpm build → .output/chrome-mv3).
 */
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 60 * 1000,
  expect: { timeout: 10 * 1000 },
  fullyParallel: false,
  workers: 1, // ⚠️ BẮT BUỘC: Giới hạn 1 worker do cắm Profile Lock đơn tiến trình của Chromium
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: 'chromium-extension',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

