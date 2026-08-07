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
        '[class*="msg-item"], [class*="chat-item"], [data-id*="msg"], div[data-id], .msg-item, div[role="row"]'
      ) ?? targetElement;

    // 2. Tìm ID tin nhắn từ data-id (nếu có)
    const messageId =
      container.getAttribute('data-id') ??
      container.querySelector('[data-id]')?.getAttribute('data-id') ??
      null;

    // 3. Ưu tiên tìm text content container để tránh kéo theo UI phụ
    const textNode =
      container.querySelector(
        '[class*="text-content"], [class*="msg-text"], [class*="card-content"], [class*="msg-content"], [class*="bubble"]'
      ) ?? container;

    // 4. Lấy innerText (quy đổi HTML br/div thành \n của trình duyệt)
    const extractedText = (textNode as HTMLElement).innerText ?? textNode.textContent ?? '';

    return {
      messageId,
      extractedText,
      containerClass: container.className || undefined,
    };
  }
}
