import { expect } from '@playwright/test';
import { extensionTest, inspectStorage } from '../fixtures/extension.fixture';
import { ZaloMessageSanitizerModule } from '../../../src/3_modules/sub-modules/zalo-message-sanitizer';

/**
 * E2E test tích hợp 2 Stage Pipeline:
 * 1. Stage 1 (zalo-extract-single-message): Bóc tách raw text từ DOM Zalo Web thật -> Output Envelope 'EXTRACTED'
 * 2. Stage 2 (zalo-message-sanitizer): Tiếp nhận data từ 'EXTRACTED' -> Lọc hoa hồng, rác, nhãn -> Output Envelope 'SANITIZED'
 * 3. Gửi Telemetry log sink qua Chrome Extension IPC và kiểm tra Session Storage Ring Buffer.
 */

const MOCK_ZALO_WEB_DOM_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Mock Zalo Web Chat - Full Pipeline E2E</title>
</head>
<body>
  <div id="chat-container">
    <div class="msg-item msg-text-bubble" data-id="msg-zalo-pipe-2026">
      <div class="avatar-user">Avatar</div>
      <div class="sender-name">Nguyễn Văn B</div>
      <div class="msg-content text-content">
        <span>🌷 40% - 12m Mã: 🏆 2026</span><br>
        <span>🏢 Địa chỉ: Phố Huế - Hai Bà Trưng - 50m2 x 5 tầng</span><br>
        <span>⌛️ Trống: Vào ngay</span><br>
        <span>Giá chốt: 12.5 tỷ (có thương lượng) 🏠📍</span><br>
        <span>Liên hệ chính chủ: 0912345678</span><br>
        <span>Nguồn hàng cập nhật liên tục tại</span><br>
        <span>🏆TL21House🏆</span><br>
        <span class="read-more-btn">Xem thêm</span>
      </div>
      <div class="msg-time">02:15 PM</div>
    </div>
  </div>
</body>
</html>
`;

extensionTest(
  'zalo-sanitizer: chuỗi pipeline zalo-extract-single-message (EXTRACTED) -> zalo-message-sanitizer (SANITIZED)',
  async ({ page }) => {
    const traceId = `e2e-zalo-pipeline-${Date.now()}`;

    // 1. Load trang HTML giả lập DOM Zalo Web
    await page.setContent(MOCK_ZALO_WEB_DOM_HTML);

    // 2. STAGE 1: Bóc tách tin nhắn từ DOM Zalo Web (zalo-extract-single-message stage)
    const extractResult = await page.evaluate((tid) => {
      const container = document.querySelector('.msg-item');
      if (!container) return null;

      const messageId = container.getAttribute('data-id');
      const textNode = container.querySelector('.msg-content');
      let extractedText = (textNode as HTMLElement)?.innerText ?? textNode?.textContent ?? '';

      // Strip 'Xem thêm' ở bước extract (ZaloExtractSingleMessage behavior)
      extractedText = extractedText.replace(/\n?Xem thêm$/i, '').trim();

      return {
        stage: 'EXTRACTED',
        success: true,
        timestamp: Date.now(),
        traceId: tid,
        data: {
          messageId,
          extractedText,
        },
        metadata: {
          source: 'zalo-web-dom-adapter',
          containerClass: container.className,
          textLength: extractedText.length,
          hasEmoji: /[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(extractedText),
          hasNewline: extractedText.includes('\n'),
        },
        error: null,
      };
    }, traceId);

    // Verify Output Envelope Stage 1 EXTRACTED
    expect(extractResult).not.toBeNull();
    expect(extractResult?.success).toBe(true);
    expect(extractResult?.stage).toBe('EXTRACTED');
    expect(extractResult?.data?.messageId).toBe('msg-zalo-pipe-2026');
    expect(extractResult?.data?.extractedText).toContain('🌷 40% - 12m Mã: 🏆 2026');
    expect(extractResult?.data?.extractedText).toContain('🏢 Địa chỉ: Phố Huế - Hai Bà Trưng - 50m2 x 5 tầng');

    // 3. STAGE 2: Chuyển dữ liệu trích xuất sang ZaloMessageSanitizerModule (Pure TS module)
    const sanitizerModule = new ZaloMessageSanitizerModule();
    const sanitizeResult = await sanitizerModule.process({
      traceId,
      rawText: extractResult!.data!.extractedText,
      options: {
        filterBranding: true,
        filterCommission: true,
      },
    });

    // Verify Output Envelope Stage 2 SANITIZED
    expect(sanitizeResult.success).toBe(true);
    expect(sanitizeResult.stage).toBe('SANITIZED');
    expect(sanitizeResult.traceId).toBe(traceId);
    expect(sanitizeResult.data?.sanitizedText).toContain('Mã: 🏆 2026');
    expect(sanitizeResult.data?.sanitizedText).toContain('🏢 Địa chỉ: Phố Huế - Hai Bà Trưng - 50m2 x 5 tầng');
    expect(sanitizeResult.data?.sanitizedText).toContain('Giá chốt: 12.5 tỷ (có thương lượng) 🏠📍');
    expect(sanitizeResult.data?.sanitizedText).toContain('Liên hệ chính chủ: 0912345678');
    expect(sanitizeResult.data?.sanitizedText).not.toContain('40% - 12m');
    expect(sanitizeResult.data?.sanitizedText).not.toContain('TL21House');
    expect(sanitizeResult.metadata.removedCommission).toBe(true);
    expect(sanitizeResult.metadata.removedBranding).toBe(true);
    expect(sanitizeResult.metadata.hasEmoji).toBe(true);

    // 4. Phát Telemetry log qua Chrome Extension IPC và verify Session Storage Ring Buffer
    await page.evaluate(
      ({ tid, sanitizedLen, rawLen }) => {
        void chrome.runtime.sendMessage({
          action: 'telemetry.log.sink',
          traceId: tid,
          entry: {
            trace_id: tid,
            scope: 'zalo-message-sanitizer',
            level: 'INFO',
            file_line: 'src/3_modules/sub-modules/zalo-message-sanitizer/index.ts:137',
            decision_reason: 'Hoàn tất chuỗi pipeline EXTRACTED -> SANITIZED thành công từ DOM Zalo Web',
            payload: {
              raw_length: rawLen,
              sanitized_length: sanitizedLen,
              pipeline_stages: ['EXTRACTED', 'SANITIZED'],
            },
            timestamp: new Date().toISOString(),
          },
        });
      },
      {
        tid: traceId,
        sanitizedLen: sanitizeResult.data!.sanitizedText.length,
        rawLen: sanitizeResult.data!.originalText.length,
      }
    );

    // Verify Telemetry Log Buffer nhận entry từ pipeline
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
    expect((bufferEntry as { scope: string }).scope).toBe('zalo-message-sanitizer');
  }
);
