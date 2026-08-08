import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  chromium,
  test as base,
  type BrowserContext,
  type Page,
  type Worker,
} from '@playwright/test';
import type { LogEntry } from '@contracts/log-schema';

/**
 * Fixture extension thật (ARCH-E2E-001 — launchPersistentContext với .user-data
 * kết hợp Hybrid CDP Fallback). Build extension trước khi chạy: `pnpm build`.
 */

const EXTENSION_PATH = resolve('.output/chrome-mv3');

/** Dọn dẹp file lock rác của Chromium profile (SingletonLock, SingletonCookie, SingletonSocket) */
export function cleanupStaleLocks(userDataDir: string): void {
  const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
  for (const file of lockFiles) {
    const filePath = resolve(userDataDir, file);
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
      } catch {
        // Quá trình xóa bị bỏ qua nếu lock file đã bị dọn hoặc bị cấm truy cập
      }
    }
  }
}

export interface EvlogCapturedEntry {
  rawText: string;
  [key: string]: unknown;
}

let sharedContext: BrowserContext | null = null;
let isSharedCdpConnected = false;

/** Khởi chạy hoặc kết nối tới persistent context theo đặc tả ARCH-E2E-001 */
export async function launchExtensionContext(): Promise<BrowserContext> {
  if (sharedContext !== null) return sharedContext;

  const userDataDir = process.env.USER_DATA_DIR || resolve('.user-data');
  const cdpUrl = process.env.CDP_URL || 'http://localhost:9222';

  if (!existsSync(EXTENSION_PATH)) {
    throw new Error(
      `Extension build directory not found at: ${EXTENSION_PATH}. Run 'pnpm build' first.`,
    );
  }

  try {
    const res = await fetch(`${cdpUrl}/json/version`);
    if (res.ok) {
      // Tái sử dụng phiên Chrome dev đang mở qua CDP
      const browser = await chromium.connectOverCDP(cdpUrl);
      sharedContext = browser.contexts()[0] || (await browser.newContext());
      isSharedCdpConnected = true;
      return sharedContext;
    }
  } catch {
    // Không có CDP dev server sẵn sàng
  }
    cleanupStaleLocks(userDataDir);
    const channelOption = process.env.CHROME_CHANNEL || 'chrome';
    const headlessOption = process.env.HEADLESS === 'true';

    try {
      sharedContext = await chromium.launchPersistentContext(userDataDir, {
        channel: channelOption,
        headless: headlessOption,
        ignoreDefaultArgs: ['--enable-automation'],
        args: [
          `--disable-extensions-except=${EXTENSION_PATH}`,
          `--load-extension=${EXTENSION_PATH}`,
          '--profile-directory=Default',
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-dev-shm-usage',
        ],
      });
    } catch {
      try {
        sharedContext = await chromium.launchPersistentContext(userDataDir, {
          headless: headlessOption,
          ignoreDefaultArgs: ['--enable-automation'],
          args: [
            `--disable-extensions-except=${EXTENSION_PATH}`,
            `--load-extension=${EXTENSION_PATH}`,
            '--profile-directory=Default',
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-dev-shm-usage',
          ],
        });
      } catch {
        // Fallback sang thư mục profile kiểm thử độc lập khi .user-data bị lock
        const testUserData = resolve('.user-data-test');
        cleanupStaleLocks(testUserData);
        sharedContext = await chromium.launchPersistentContext(testUserData, {
          headless: headlessOption,
          ignoreDefaultArgs: ['--enable-automation'],
          args: [
            `--disable-extensions-except=${EXTENSION_PATH}`,
            `--load-extension=${EXTENSION_PATH}`,
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-dev-shm-usage',
          ],
        });
      }
    }

    // Tự động phát hiện Extension ID ngay khi context khởi động
    let [initialWorker] = sharedContext.serviceWorkers();
    if (!initialWorker) {
      initialWorker = await sharedContext.waitForEvent('serviceworker', { timeout: 6000 }).catch(() => undefined);
    }
    if (initialWorker) {
      const match = initialWorker.url().match(/chrome-extension:\/\/([^/]+)/);
      if (match?.[1]) globalExtensionId = match[1];
    }

    isSharedCdpConnected = false;
    return sharedContext;
}

/** Đóng context nếu mở qua launchPersistentContext (không đóng nếu kết nối CDP) */
export async function closeExtensionContext(): Promise<void> {
  if (sharedContext !== null) {
    if (!isSharedCdpConnected) {
      await sharedContext.close().catch(() => {});
    }
    sharedContext = null;
    isSharedCdpConnected = false;
  }
}

let globalExtensionId: string | null = null;

/** Dò tìm Extension ID từ workers, DOM attributes hoặc pages đang mở */
export async function getExtensionId(context: BrowserContext): Promise<string> {
  if (globalExtensionId) return globalExtensionId;

  // 1. Dò từ service worker đang chạy
  const workers = context.serviceWorkers();
  for (const w of workers) {
    const match = w.url().match(/chrome-extension:\/\/([^/]+)/);
    if (match?.[1]) {
      globalExtensionId = match[1];
      return globalExtensionId;
    }
  }

  // 2. Dò từ thuộc tính data-wxt-ext-id trên DOM của các trang đang mở
  for (const p of context.pages()) {
    try {
      const extId = await p.evaluate(() => {
        return document.documentElement.getAttribute('data-wxt-ext-id');
      });
      if (extId) {
        globalExtensionId = extId;
        return globalExtensionId;
      }
    } catch {
      // Bỏ qua lỗi evaluate
    }

    const match = p.url().match(/chrome-extension:\/\/([^/]+)/);
    if (match?.[1]) {
      globalExtensionId = match[1];
      return globalExtensionId;
    }
  }

  return '';
}

/** Lấy Service Worker handle của Extension */
export async function getServiceWorker(context: BrowserContext): Promise<Worker> {
  const workers = context.serviceWorkers();
  const existing = workers.find((w) => w.url().endsWith('background.js') || w.url().startsWith('chrome-extension://'));
  if (existing !== undefined) return existing;

  // Nếu Service Worker đang ngủ (Chromium MV3 idle): Mở nhanh popup để đánh thức
  try {
    const extId = await getExtensionId(context);
    if (extId) {
      const dummyPage = await context.newPage();
      try {
        await dummyPage.goto(`chrome-extension://${extId}/popup.html`, { timeout: 2000 }).catch(() => {});
      } finally {
        await dummyPage.close().catch(() => {});
      }
    }
  } catch {
    // Bỏ qua lỗi mở dummy page
  }

  const recheck = context.serviceWorkers().find((w) => w.url().endsWith('background.js') || w.url().startsWith('chrome-extension://'));
  if (recheck !== undefined) return recheck;

  const timeoutMs = 6000;
  return new Promise<Worker>((resolveWorker, reject) => {
    const timer = setTimeout(() => {
      context.off('serviceworker', onWorker);
      const [fallbackWorker] = context.serviceWorkers();
      if (fallbackWorker !== undefined) {
        resolveWorker(fallbackWorker);
      } else {
        reject(new Error('getServiceWorker timeout — extension không load (build chưa chạy?)'));
      }
    }, timeoutMs);

    const onWorker = (w: Worker): void => {
      if (w.url().endsWith('background.js') || w.url().startsWith('chrome-extension://')) {
        clearTimeout(timer);
        context.off('serviceworker', onWorker);
        resolveWorker(w);
      }
    };
    context.on('serviceworker', onWorker);
  });
}

/** Đọc URL trang extension bằng dynamic extension ID */
export async function extensionUrl(context: BrowserContext, path: string): Promise<string> {
  const id = await getExtensionId(context);
  if (id) {
    return `chrome-extension://${id}/${path}`;
  }

  return path;
}

/** Emit log qua IPC */
export async function emitLog(
  page: Page,
  entry: Omit<LogEntry, 'trace_id' | 'timestamp'> & { trace_id?: string; timestamp?: string },
): Promise<void> {
  const traceId = entry.trace_id ?? 'e2e-trace';
  const timestamp = entry.timestamp ?? new Date().toISOString();
  const payload: LogEntry = {
    trace_id: traceId,
    scope: entry.scope,
    level: entry.level,
    file_line: entry.file_line,
    decision_reason: entry.decision_reason,
    payload: entry.payload ?? {},
    timestamp,
  };
  await page.evaluate(
    ({ tid, entry: payloadEntry }) =>
      chrome.runtime.sendMessage({
        action: 'telemetry.log.sink',
        traceId: tid,
        entry: payloadEntry,
      }),
    { tid: traceId, entry: payload },
  );
}

/** Đọc session storage qua IPC Debug Storage Inspect */
export async function inspectStorage(
  page: Page,
  area: 'local' | 'session' | 'sync' = 'session',
): Promise<Record<string, unknown>> {
  const response = await page.evaluate(
    (request: { action: string; traceId: string; area: string }) =>
      chrome.runtime.sendMessage(request) as Promise<{
        ok: boolean;
        data?: { data: Record<string, unknown> };
      }>,
    { action: 'debug.storage.inspect', traceId: 'e2e-inspect', area },
  );
  if (response?.ok !== true) throw new Error('StorageInspect failed');
  return response.data?.data ?? {};
}

/** Đợi log entry có traceId khớp xuất hiện trong session storage */
export async function waitForEntry(
  page: Page,
  traceId: string,
  timeoutMs = 10_000,
): Promise<LogEntry> {
  const deadline = Date.now() + timeoutMs;
  let last = '';
  while (Date.now() < deadline) {
    const data = await inspectStorage(page, 'session');
    const buffer = (data['telemetry.logs.buffer'] ?? []) as LogEntry[];
    const match = buffer.find((e) => e.trace_id === traceId);
    if (match !== undefined) return match;
    last = `buffer=${buffer.length} entries`;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(
    `waitForEntry timeout ${timeoutMs}ms (${last}) — traceId ${traceId} không xuất hiện`,
  );
}

/** Fixture chính export cho các kịch bản test */
export const extensionTest = base.extend<{
  context: BrowserContext;
  sw: Worker;
  page: Page;
  zaloPage: Page;
  openPage: (path: string) => Promise<Page>;
  evlogs: EvlogCapturedEntry[];
}>({
  context: async ({}, use) => {
    const ctx = await launchExtensionContext();
    await use(ctx);
    await closeExtensionContext();
  },
  sw: async ({ context }, use) => {
    const worker = await getServiceWorker(context);
    await use(worker);
  },
  page: async ({ context }, use) => {
    if (!globalExtensionId) {
      const initPage = await context.newPage();
      try {
        await initPage.goto('https://chat.zalo.me', { waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});
        const extId = await initPage.evaluate(() => document.documentElement.getAttribute('data-wxt-ext-id')).catch(() => null);
        if (extId) globalExtensionId = extId;
      } finally {
        await initPage.close().catch(() => {});
      }
    }
    const page = await context.newPage();
    try {
      await page.goto(await extensionUrl(context, 'popup.html'));
      await use(page);
    } finally {
      await page.close().catch(() => {});
    }
  },
  zaloPage: async ({ context }, use) => {
    let page = context.pages().find((p) => p.url().includes('zalo.me'));
    let isCreated = false;
    if (!page) {
      page = await context.newPage();
      isCreated = true;
      await page.goto('https://chat.zalo.me', { waitUntil: 'domcontentloaded' });
    }
    try {
      const extId = await page.evaluate(() => document.documentElement.getAttribute('data-wxt-ext-id')).catch(() => null);
      if (extId) globalExtensionId = extId;
    } catch {}

    try {
      await use(page);
    } finally {
      if (isCreated && !isSharedCdpConnected) {
        await page.close().catch(() => {});
      }
    }
  },
  openPage: async ({ context }, use) => {
    const createdPages: Page[] = [];
    try {
      await use(async (path: string) => {
        const page = await context.newPage();
        createdPages.push(page);
        await page.goto(await extensionUrl(context, path));
        return page;
      });
    } finally {
      for (const p of createdPages) {
        await p.close().catch(() => {});
      }
    }
  },
  evlogs: async ({ context }, use) => {
    const capturedLogs: EvlogCapturedEntry[] = [];

    const handleConsoleMessage = (msg: { text: () => string }) => {
      const text = msg.text();
      try {
        if (text.includes('trace_id') || text.includes('decision_reason')) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const parsed = JSON.parse(text);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          capturedLogs.push({ ...parsed, rawText: text });
        } else {
          capturedLogs.push({ rawText: text });
        }
      } catch {
        capturedLogs.push({ rawText: text });
      }
    };

    const pageListener = (p: Page) => p.on('console', handleConsoleMessage);
    context.pages().forEach((p) => p.on('console', handleConsoleMessage));
    context.on('page', pageListener);
    context.serviceWorkers().forEach((sw) => sw.on('console', handleConsoleMessage));

    try {
      await use(capturedLogs);
    } finally {
      context.off('page', pageListener);
      context.pages().forEach((p) => p.off('console', handleConsoleMessage));
      context.serviceWorkers().forEach((sw) => sw.off('console', handleConsoleMessage));
      capturedLogs.length = 0;
    }
  },
});

