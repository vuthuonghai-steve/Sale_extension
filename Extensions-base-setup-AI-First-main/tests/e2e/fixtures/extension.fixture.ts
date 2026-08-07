import { existsSync, unlinkSync } from 'node:fs';
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
    const channelOption = process.env.CHROME_CHANNEL || 'chromium';
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
      // Fallback không chỉ định channel
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
    }
    isSharedCdpConnected = false;

  return sharedContext;
}

/** Đóng context nếu mở qua launchPersistentContext (không đóng nếu kết nối CDP) */
export async function closeExtensionContext(): Promise<void> {
  if (sharedContext !== null) {
    if (!isSharedCdpConnected) {
      await sharedContext.close();
    }
    sharedContext = null;
    isSharedCdpConnected = false;
  }
}

/** Lấy Service Worker handle của Extension */
export async function getServiceWorker(context: BrowserContext): Promise<Worker> {
  const [worker] = context.serviceWorkers();
  if (worker !== undefined && worker.url().endsWith('background.js')) return worker;

  const timeoutMs = 10_000;
  return new Promise<Worker>((resolveWorker, reject) => {
    const timer = setTimeout(() => {
      context.off('serviceworker', onWorker);
      reject(new Error('getServiceWorker timeout — extension không load (build chưa chạy?)'));
    }, timeoutMs);
    const onWorker = (w: Worker): void => {
      if (w.url().endsWith('background.js')) {
        clearTimeout(timer);
        context.off('serviceworker', onWorker);
        resolveWorker(w);
      }
    };
    context.on('serviceworker', onWorker);
  });
}

/** Độc URL trang extension bằng dynamic extension ID */
export async function extensionUrl(context: BrowserContext, path: string): Promise<string> {
  const sw = await getServiceWorker(context);
  const id = await sw.evaluate(() => chrome.runtime.id);
  return `chrome-extension://${id}/${path}`;
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
    const page = await context.newPage();
    await page.goto(await extensionUrl(context, 'popup.html'));
    await use(page);
  },
  openPage: async ({ context }, use) => {
    await use(async (path: string) => {
      const page = await context.newPage();
      await page.goto(await extensionUrl(context, path));
      return page;
    });
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

    context.pages().forEach((p) => p.on('console', handleConsoleMessage));
    context.on('page', (p) => p.on('console', handleConsoleMessage));
    context.serviceWorkers().forEach((sw) => sw.on('console', handleConsoleMessage));

    await use(capturedLogs);
  },
});
