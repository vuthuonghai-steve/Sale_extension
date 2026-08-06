import { test as base, expect, chromium, type BrowserContext, type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { existsSync, unlinkSync } from 'node:fs';

export interface EvlogCapturedEntry {
  trace_id?: string;
  scope?: string;
  level?: string;
  file_line?: string;
  decision_reason?: string;
  payload?: Record<string, unknown>;
  timestamp?: string;
  rawText: string;
}

export type ExtensionFixtures = {
  context: BrowserContext;
  page: Page;
  extensionId: string;
  evlogs: EvlogCapturedEntry[];
};

export function createEvlogEntry(
  scope: string,
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL',
  decisionReason: string,
  payload: Record<string, unknown>,
  fileLine = 'tests/e2e-playwright/fixtures.ts:40'
): EvlogCapturedEntry {
  const entry: EvlogCapturedEntry = {
    trace_id: `e2e_trace_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    scope,
    level,
    file_line: fileLine,
    decision_reason: decisionReason,
    payload,
    timestamp: new Date().toISOString(),
    rawText: '',
  };
  entry.rawText = JSON.stringify(entry);
  return entry;
}

function cleanupStaleLocks(userDataDir: string): void {
  const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
  for (const file of lockFiles) {
    const filePath = resolve(userDataDir, file);
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
        console.log(`[E2E Fixture] Cleaned up stale lock file: ${file}`);
      } catch (e) {
        console.warn(`[E2E Fixture] Could not remove lock file ${file}:`, e);
      }
    }
  }
}

export const test = base.extend<ExtensionFixtures>({
  context: async ({}, use) => {
    const pathToExtension = resolve('.output/chrome-mv3');
    const userDataDir = process.env.USER_DATA_DIR || resolve('.user-data');
    const cdpUrl = process.env.CDP_URL || 'http://localhost:9222';

    if (!existsSync(pathToExtension)) {
      throw new Error(
        `Extension build directory not found at: ${pathToExtension}. Please run 'npm run build' before executing E2E tests.`
      );
    }

    let isCdpAvailable = false;
    try {
      const res = await fetch(`${cdpUrl}/json/version`);
      if (res.ok) {
        isCdpAvailable = true;
      }
    } catch {
      isCdpAvailable = false;
    }

    let context: BrowserContext;
    let isCdpConnected = false;

    if (isCdpAvailable) {
      console.log(`[E2E Fixture] Reusing existing Chrome browser session via CDP: ${cdpUrl}`);
      const browser = await chromium.connectOverCDP(cdpUrl);
      context = browser.contexts()[0] || (await browser.newContext());
      isCdpConnected = true;
    } else {
      cleanupStaleLocks(userDataDir);
      console.log(`[E2E Fixture] Launching persistent Chrome context with User Data Dir: ${userDataDir}`);
      context = await chromium.launchPersistentContext(userDataDir, {
        channel: 'chrome',
        headless: false,
        ignoreDefaultArgs: ['--enable-automation'],
        args: [
          `--disable-extensions-except=${pathToExtension}`,
          `--load-extension=${pathToExtension}`,
          '--profile-directory=Default',
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-dev-shm-usage',
        ],
      });
    }

    await use(context);

    if (!isCdpConnected) {
      await context.close();
    }
  },

  extensionId: async ({ context }, use) => {
    let background = context.serviceWorkers()[0];
    if (!background) {
      try {
        background = await context.waitForEvent('serviceworker', { timeout: 3000 });
      } catch {
        console.warn('[E2E Fixture] Service worker event not triggered within 3s.');
      }
    }
    const extensionId = background ? background.url().split('/')[2] : 'loaded';
    await use(extensionId);
  },

  evlogs: async ({ context }, use) => {
    const capturedLogs: EvlogCapturedEntry[] = [];

    const handleConsoleMessage = (msg: { text: () => string }) => {
      const text = msg.text();
      try {
        if (text.includes('trace_id') || text.includes('decision_reason')) {
          const parsed = JSON.parse(text);
          capturedLogs.push({ ...parsed, rawText: text });
        } else {
          capturedLogs.push({ rawText: text });
        }
      } catch {
        capturedLogs.push({ rawText: text });
      }
    };

    context.pages().forEach((p) => p.on('console', handleConsoleMessage));
    context.on('page', (p) => p.on('console', handleConsoleMessage));
    context.serviceWorkers().forEach((sw) => sw.on('console', handleConsoleMessage));

    await use(capturedLogs);
  },

  page: async ({ context, evlogs }, use) => {
    const page = context.pages()[0] || (await context.newPage());

    // Listen for page navigation & URL changes to catch Zalo login redirects / session kicks
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        const url = frame.url();
        if (url.includes('id.zalo.me')) {
          const logEntry = createEvlogEntry(
            '@e2e/zalo-session-monitor',
            'WARN',
            'SINGLE_CONCURRENT_SESSION_KICKED_BY_ZALO_WEB',
            {
              redirectedUrl: url,
              reason:
                'Zalo Web enforces single active session per account. Detected redirect to login page (id.zalo.me).',
              recommendation:
                'Close conflicting active Zalo tab in dev browser or run via CDP (port 9222).',
            },
            'tests/e2e-playwright/fixtures.ts:140'
          );
          evlogs.push(logEntry);
          console.warn(
            `\n⚠️ [Evlog RCA Alert] ${logEntry.decision_reason}: ${JSON.stringify(logEntry.payload)}\n`
          );
        }
      }
    });

    await use(page);
  },
});

export { expect };
