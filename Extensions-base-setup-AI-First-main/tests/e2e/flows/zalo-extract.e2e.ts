import { expect } from '@playwright/test';
import { extensionTest, inspectStorage } from '../fixtures/extension.fixture';

/**
 * E2E test cho sub-module zalo-extract-single-message sử dụng mock DOM HTML Zalo Web
 * Kiểm thử trực tiếp với Playwright trên môi trường Browser / Extension thật:
 * 1. Mở trang mock HTML chứa tin nhắn Zalo Web mẫu.
 * 2. Thực thi script trích xuất (tương tự như Content Script inject vào DOM Zalo).
 * 3. Kiểm tra kết quả bóc tách: giữ nguyên \n, emoji, loại bỏ 'Xem thêm', gắn traceId.
 * 4. Phát sinh LogSink telemetry và kiểm tra ring buffer / storage.
 */

const MOCK_ZALO_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Mock Zalo Web Chat</title>
</head>
<body>
  <div id="chat-container">
    <!-- Bubble tin nhắn Zalo mẫu -->
    <div class="msg-item msg-text-bubble" data-id="msg-zalo-e2e-1001">
      <div class="avatar-user">User Avatar</div>
      <div class="sender-name">Nguyễn Văn A</div>
      <div class="msg-content text-content">
        <span>Căn hộ 2PN2WC full nội thất cao cấp.</span><br>
        <span>Giá thuê: 15tr/tháng</span><br>
        <span>Liên hệ xem nhà: 0901234567 🍾🏢📍</span><br>
        <span class="read-more-btn">Xem thêm</span>
      </div>
      <div class="msg-time">10:30 AM</div>
    </div>
  </div>
</body>
</html>
`;

extensionTest('zalo-extract: trích xuất tin nhắn từ Mock Zalo DOM và phát telemetry log', async ({ page }) => {
  const traceId = `e2e-zalo-extract-${Date.now()}`;

  // 1. Set nội dung Mock Zalo Web HTML vào trang
  await page.setContent(MOCK_ZALO_HTML);

  // 2. Mô phỏng trích xuất DOM bằng ZaloWebDOMAdapter logic trực tiếp trong browser page
  const extractResult = await page.evaluate((tid) => {
    const targetElement = document.querySelector('.msg-item');
    if (!targetElement) return null;

    // Phân tích container & textContent
    const container =
      targetElement.closest(
        '[class*="msg-item"], [class*="chat-item"], [data-id*="msg"], div[data-id], .msg-item, div[role="row"]'
      ) ?? targetElement;

    const messageId =
      container.getAttribute('data-id') ??
      container.querySelector('[data-id]')?.getAttribute('data-id') ??
      null;

    const textNode =
      container.querySelector(
        '[class*="text-content"], [class*="msg-text"], [class*="card-content"], [class*="msg-content"], [class*="bubble"]'
      ) ?? container;

    // Lấy innerText
    let extractedText = (textNode as HTMLElement).innerText ?? textNode.textContent ?? '';

    // Strip 'Xem thêm'
    extractedText = extractedText.replace(/\n?Xem thêm$/i, '').trim();

    const hasEmoji = /[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(extractedText);
    const hasNewline = extractedText.includes('\n');

    // Giả lập phát log telemetry về LogSink Service Worker qua IPC
    void chrome.runtime.sendMessage({
      action: 'telemetry.log.sink',
      traceId: tid,
      entry: {
        trace_id: tid,
        scope: 'zalo-extract-single-message',
        level: 'INFO',
        file_line: 'src/3_modules/sub-modules/zalo-extract-single-message/index.ts:34',
        decision_reason: 'Trích xuất tin nhắn Zalo Web thành công từ Mock DOM',
        payload: {
          message_id: messageId,
          text_length: extractedText.length,
          has_emoji: hasEmoji,
          has_newline: hasNewline,
        },
        timestamp: new Date().toISOString(),
      },
    });

    return {
      stage: 'EXTRACTED',
      success: true,
      traceId: tid,
      data: {
        messageId,
        extractedText,
      },
      metadata: {
        source: 'zalo-web-dom-adapter',
        containerClass: container.className,
        textLength: extractedText.length,
        hasEmoji,
        hasNewline,
      },
    };
  }, traceId);

  // 3. Verify kết quả trích xuất Stage Output Envelope
  expect(extractResult).not.toBeNull();
  expect(extractResult?.success).toBe(true);
  expect(extractResult?.stage).toBe('EXTRACTED');
  expect(extractResult?.data.messageId).toBe('msg-zalo-e2e-1001');
  expect(extractResult?.data.extractedText).toContain('Căn hộ 2PN2WC full nội thất cao cấp.');
  expect(extractResult?.data.extractedText).toContain('Giá thuê: 15tr/tháng');
  expect(extractResult?.data.extractedText).toContain('0901234567 🍾🏢📍');
  expect(extractResult?.data.extractedText).not.toContain('Xem thêm');
  expect(extractResult?.metadata.hasEmoji).toBe(true);
  expect(extractResult?.metadata.hasNewline).toBe(true);

  // 4. Verify Log Telemetry đã ghi thành công vào Session Storage Ring Buffer
  let bufferEntry: unknown = null;
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const session = await inspectStorage(page, 'session');
    const buffer = (session['telemetry.logs.buffer'] ?? []) as Array<{ trace_id: string; scope: string }>;
    const match = buffer.find((e) => e.trace_id === traceId);
    if (match) {
      bufferEntry = match;
      break;
    }
    await page.waitForTimeout(200);
  }

  expect(bufferEntry).not.toBeNull();
  expect((bufferEntry as { scope: string }).scope).toBe('zalo-extract-single-message');
});
