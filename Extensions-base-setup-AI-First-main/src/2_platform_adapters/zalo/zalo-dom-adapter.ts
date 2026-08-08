import type {
  IZaloDOMAdapter,
  IZaloRawExtractResult,
} from '../../0_contracts/zalo-extract.contract';

/**
 * Layer 2 — Platform Adapter bọc các truy vấn DOM trực tiếp trên Zalo Web.
 * Nhiệm vụ duy nhất: Đọc raw innerText từ Target Element hoặc message container,
 * bảo toàn \n và emoji Unicode.
 */
export class ZaloWebDOMAdapter implements IZaloDOMAdapter {
  /**
   * Trích xuất văn bản thô từ một Target Message Element trên Zalo Web DOM
   */
  public extractMessageFromElement(targetElement: Element | null): IZaloRawExtractResult | null {
    if (!targetElement) {
      return null;
    }

    // 1. Tìm container bong bóng tin nhắn chính hoặc sử dụng chính targetElement
    const container =
      targetElement.closest(
        '[class*="msg-item"], [class*="chat-item"], [data-id*="msg"], div[data-id], .msg-item, div[role="row"], div[class*="message"], div[class*="bubble"], div[class*="msg"], div[class*="card"]'
      ) ?? targetElement;

    // 2. Tìm ID tin nhắn từ data-id (nếu có)
    const messageId =
      container.getAttribute('data-id') ??
      container.querySelector('[data-id]')?.getAttribute('data-id') ??
      null;

    // 3. Tự động click mở rộng "Xem thêm" nếu tin nhắn đang bị thu gọn trên Zalo Web
    try {
      const readMoreBtn =
        container.querySelector(
          '[class*="read-more"], [class*="see-more"], [class*="show-more"], a[class*="more"], span[class*="more"], [class*="more-btn"], button[class*="more"]'
        ) ||
        Array.from(container.querySelectorAll('a, span, button, div')).find((el) =>
          /^(Xem thêm|\.\.\.Xem thêm|Show more|\.\.\. Xem thêm)$/i.test((el.textContent || '').trim())
        );

      if (readMoreBtn && typeof (readMoreBtn as HTMLElement).click === 'function') {
        (readMoreBtn as HTMLElement).click();
      }
    } catch {
      // Safe fallback if click is not supported in test environment
    }

    // 4. Ưu tiên tìm text content container chứa toàn bộ các dòng tin nhắn
    // Lưu ý: Không dùng query `span[class*="text"]` vì sẽ chỉ bắt thẻ span đầu tiên!
    const textNode =
      container.querySelector(
        '[class*="text-content"], [class*="msg-text"], [class*="card-content"], [class*="msg-content"], [class*="bubble"], [class*="card--text"], pre'
      ) ?? container;

    // 5. Clone node để loại bỏ các thành phần UI thừa (quote reply banner, reaction count, time badge...)
    let extractedText = '';
    if (typeof textNode.cloneNode === 'function') {
      try {
        const cloned = textNode.cloneNode(true) as HTMLElement;
        const quoteSelectors = [
          '[class*="quote"]',
          '[class*="reply"]',
          '[class*="rel-msg"]',
          '[class*="reference"]',
          '[class*="quoted"]',
          '[data-id*="quote"]',
          '[class*="reaction"]',
          '[class*="time-badge"]',
        ];
        const quoteElements = cloned.querySelectorAll(quoteSelectors.join(', '));
        quoteElements.forEach((el) => el.remove());
        extractedText = cloned.innerText ?? cloned.textContent ?? '';
      } catch {
        extractedText = (textNode as HTMLElement).innerText ?? textNode.textContent ?? '';
      }
    } else {
      extractedText = (textNode as HTMLElement).innerText ?? textNode.textContent ?? '';
    }

    // 6. Cắt bỏ nhãn nút "Xem thêm" / "Thu gọn" ở cuối nếu còn sót lại
    extractedText = extractedText
      .replace(/\n?(\.\.\.)?\s*(Xem\s+thêm|Thu\s+gọn|Show\s+more)\s*$/i, '')
      .trim();

    return {
      messageId,
      extractedText,
      containerClass: container.className || undefined,
    };
  }
}
