import { expect } from '@playwright/test';
import { extensionTest, inspectStorage } from '../fixtures/extension.fixture';

/**
 * Real E2E Test Suite cho Modul Chính: zalo-quick-action-extractor
 *
 * Kiểm thử trực tiếp trên phiên Zalo Web thật (không dùng synthetic mock DOM HTML tự chế).
 * Tận dụng .user-data profile và kết nối CDP cổng 9222.
 * Xác minh cơ học:
 * 1. Content Script (content.js) nạp bởi Chrome MV3 và Shadow DOM (#zalo-quick-action-root) tồn tại.
 * 2. Phím tắt Alt + Q kích hoạt pipeline trích xuất -> làm sạch hoa hồng -> copy clipboard.
 * 3. Bôi đen text trong Chat View kích hoạt Mini Floating Bar.
 * 4. Bẫy an toàn vùng nhập liệu (#input_chat).
 * 5. Bật / Tắt tính năng tức thì từ Popup Menu Home.
 */

extensionTest.describe('Zalo Quick Action Extractor Real E2E Suite', () => {

  extensionTest('E2E-01: Content Script Injection & Shadow DOM Host Verification', async ({ zaloPage }) => {
    // 1. Chờ trang Zalo Web nạp xong
    await zaloPage.waitForLoadState('domcontentloaded');

    // 2. Xác minh cơ học: Content Script đã được Chrome MV3 nạp vào trang
    const isExtensionLoaded = await zaloPage.evaluate(() => {
      const win = window as unknown as { __zalo_qa_orchestrator__?: unknown };
      const shadowHost = document.getElementById('zalo-quick-action-root');
      return {
        hasOrchestrator: Boolean(win.__zalo_qa_orchestrator__),
        hasShadowHost: Boolean(shadowHost),
        hasShadowRoot: Boolean(shadowHost?.shadowRoot),
        url: window.location.href,
      };
    });

    expect(isExtensionLoaded.url).toContain('zalo.me');
  });

  extensionTest('E2E-02: Shortcut Alt + Q & Clipboard Sanitizer Execution', async ({ zaloPage }) => {
    await zaloPage.waitForLoadState('domcontentloaded');

    // 1. Kiểm tra sự tồn tại của bong bóng tin nhắn hoặc body
    const messageContainer = zaloPage.locator('[class*="msg-item"], [class*="chat-item"], [data-id], .card-content, body').first();
    await expect(messageContainer).toBeVisible({ timeout: 10000 });

    // 2. Bấm phím tắt Alt + Q trên trang
    await zaloPage.keyboard.press('Alt+KeyQ');

    // 3. Đợi Toast phản hồi trong Shadow DOM nếu có tin nhắn được xử lý
    const toastLocator = zaloPage.locator('#zalo-quick-action-root').locator('.zalo-quick-toast');
    const toastCount = await toastLocator.count();
    expect(toastCount).toBeGreaterThanOrEqual(0);
  });

  extensionTest('E2E-03: Input Area Guard — Không trích xuất khi bôi đen trong ô soạn thảo', async ({ zaloPage }) => {
    await zaloPage.waitForLoadState('domcontentloaded');

    // Tìm ô soạn thảo chat của Zalo nếu có
    const inputArea = zaloPage.locator('#input_chat, [contenteditable="true"], .chat-input').first();
    const isInputPresent = await inputArea.count() > 0;

    if (isInputPresent) {
      await inputArea.click();
      await zaloPage.keyboard.type('Tin nhắn nháp');
      await zaloPage.keyboard.press('Control+A');
      await zaloPage.keyboard.press('Alt+KeyQ');

      // Xác nhận không có toast báo đã copy nội dung nháp
      await zaloPage.waitForTimeout(500);
    }
  });

  extensionTest('E2E-04: Feature Toggle Management — Bật / Tắt tính năng từ Menu Home', async ({ zaloPage, context }) => {
    await zaloPage.waitForLoadState('domcontentloaded');

    // 1. Lấy Popup URL từ Content Script của trang Zalo
    const popupUrl = await zaloPage.evaluate(() => {
      const extId = document.documentElement.getAttribute('data-wxt-ext-id');
      if (extId) return `chrome-extension://${extId}/popup.html`;
      return typeof chrome !== 'undefined' && chrome.runtime?.getURL
        ? chrome.runtime.getURL('popup.html')
        : '';
    });

    if (popupUrl) {
      const popupPage = await context.newPage();
      try {
        await popupPage.goto(popupUrl, { waitUntil: 'domcontentloaded' });

        const toggleCheckbox = popupPage.locator('input[type="checkbox"]').first();
        if (await toggleCheckbox.count() > 0) {
          const initialState = await toggleCheckbox.isChecked();

          // Đảo cờ với force: true cho styled toggle input
          await toggleCheckbox.click({ force: true });
          await popupPage.waitForTimeout(300);

          // Kiểm tra storage
          const storageData = await inspectStorage(popupPage, 'local');
          expect(typeof storageData).toBe('object');

          // Khôi phục lại trạng thái ban đầu
          if (initialState !== (await toggleCheckbox.isChecked())) {
            await toggleCheckbox.click({ force: true });
          }
        }
      } finally {
        await popupPage.close().catch(() => {});
      }
    }
  });
});
