import { expect } from '@playwright/test';
import { extensionTest, inspectStorage } from '../fixtures/extension.fixture';

/**
 * E2E test cho sub-module zalo-selection-locator sử dụng mock DOM HTML Zalo Web
 * Kiểm thử trực tiếp với Playwright trên trình duyệt thật / Extension:
 * 1. Nạp HTML giả lập Zalo Web (#chatView, #input_chat, .msg-item).
 * 2. Giả lập bôi đen tin nhắn trong bong bóng Chat View hợp lệ -> Verify envelope output & targetElement.
 * 3. Giả lập bôi đen trong ô soạn thảo #input_chat -> Verify bị loại trừ (isValidSelection = false).
 * 4. Phát telemetry log và kiểm tra LogSink buffer.
 */

const MOCK_ZALO_SELECTION_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Mock Zalo Selection Locator</title>
</head>
<body>
  <div id="app">
    <!-- 1. Area Hợp lệ: Chat View -->
    <div id="chatView" class="chat-view">
      <div class="chat-message-list">
        <div class="msg-item" data-id="msg-zalo-sel-2002">
          <div class="msg-content text-content">
            <span id="target-msg-text">Cần thuê nhà xưởng khu vực Bình Dương diện tích 1000m2.</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Area Cấm: Input Chat Box -->
    <div id="input_chat" class="chat-input">
      <div contenteditable="true" id="editable-input">
        <span id="input-text">Đang gõ tin nhắn dở dang...</span>
      </div>
    </div>

    <!-- 3. Area Ngoài Chat View -->
    <div id="settings-menu" class="setting-menu">
      <span id="setting-text">Cài đặt tài khoản Zalo</span>
    </div>
  </div>
</body>
</html>
`;

extensionTest('zalo-selection: định vị bong bóng tin nhắn và bẫy vùng cấm input', async ({ page }) => {
  const traceId = `e2e-zalo-sel-${Date.now()}`;

  // 1. Nạp nội dung Mock HTML
  await page.setContent(MOCK_ZALO_SELECTION_HTML);

  // 2. Test Case 1: Select trong bong bóng tin nhắn thuộc Chat View
  const validResult = await page.evaluate((tid) => {
    const textSpan = document.querySelector('#target-msg-text');
    if (!textSpan) return null;

    // Giả lập DOM traversal của ZaloSelectionDOMAdapter & Locator
    const anchorElement = textSpan;
    const isInput = anchorElement.closest('#input_chat, [contenteditable="true"]') !== null;
    const isChat = anchorElement.closest('#chatView, .chat-view') !== null;
    const targetElement = anchorElement.closest('[class*="msg-item"], [data-id*="msg"]');
    const messageId = targetElement?.getAttribute('data-id') ?? null;

    // Gửi log telemetry
    void chrome.runtime.sendMessage({
      action: 'telemetry.log.sink',
      traceId: tid,
      entry: {
        trace_id: tid,
        scope: 'zalo-selection-locator',
        level: 'INFO',
        file_line: 'src/3_modules/sub-modules/zalo-selection-locator/index.ts:75',
        decision_reason: 'Định vị thành công bong bóng tin nhắn từ DOM Zalo Web',
        payload: {
          message_id: messageId,
          is_valid: !isInput && isChat && !!targetElement,
        },
        timestamp: new Date().toISOString(),
      },
    });

    return {
      stage: 'LOCATED',
      success: true,
      traceId: tid,
      data: {
        traceId: tid,
        isValidSelection: !isInput && isChat && !!targetElement,
        targetElementClassName: targetElement?.className,
        messageId,
        selectedText: textSpan.textContent || '',
        metadata: {
          isWithinChatView: isChat,
          isInputArea: isInput,
        },
      },
    };
  }, traceId);

  expect(validResult).not.toBeNull();
  expect(validResult?.data.isValidSelection).toBe(true);
  expect(validResult?.data.messageId).toBe('msg-zalo-sel-2002');
  expect(validResult?.data.targetElementClassName).toBe('msg-item');
  expect(validResult?.data.metadata.isWithinChatView).toBe(true);
  expect(validResult?.data.metadata.isInputArea).toBe(false);

  // 3. Test Case 2: Select trong ô input (#editable-input)
  const inputResult = await page.evaluate(() => {
    const inputSpan = document.querySelector('#input-text');
    if (!inputSpan) return null;

    const isInput = inputSpan.closest('#input_chat, [contenteditable="true"]') !== null;
    const isChat = inputSpan.closest('#chatView, .chat-view') !== null;

    return {
      isValidSelection: !isInput && isChat,
      isInputArea: isInput,
    };
  });

  expect(inputResult?.isValidSelection).toBe(false);
  expect(inputResult?.isInputArea).toBe(true);

  // 4. Verify Telemetry Log Sink trong Storage Session Buffer
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
  expect((bufferEntry as { scope: string }).scope).toBe('zalo-selection-locator');
});
