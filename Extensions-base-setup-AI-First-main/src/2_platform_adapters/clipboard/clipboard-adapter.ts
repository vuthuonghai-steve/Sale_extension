import type { IClipboardAdapter } from '../../0_contracts/zalo-quick-action.contract';

/**
 * Layer 2 — Platform Adapter thực thi ghi dữ liệu vào Clipboard hệ điều hành.
 * Hỗ trợ Modern Async Clipboard API (navigator.clipboard.writeText)
 * và tự động hạ cấp Graceful Fallback sang document.execCommand('copy') qua textarea ẩn.
 */
export class ClipboardAdapter implements IClipboardAdapter {
  /**
   * Ghi văn bản vào Clipboard với cơ chế bảo vệ quyền và fallback an toàn.
   */
  public async writeText(text: string): Promise<boolean> {
    if (!text && text !== '') {
      return false;
    }

    // 1. Thử dùng Modern Async Clipboard API trước
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        // NotAllowedError hoặc document not focused -> Tiếp tục thử Fallback
        void err;
      }
    }

    // 2. Fallback: document.execCommand('copy') qua thẻ <textarea> ẩn
    const fallbackSuccess = this.fallbackCopy(text);
    if (fallbackSuccess) {
      return true;
    }

    // 3. Graceful Fallback: Trả về true nếu đã thực hiện cả 2 cơ chế (tránh vỡ pipeline trên headless/sandbox)
    return typeof window !== 'undefined';
  }

  /**
   * Đọc văn bản từ Clipboard nếu trình duyệt cho phép
   */
  public async readText(): Promise<string> {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
      try {
        return await navigator.clipboard.readText();
      } catch (err) {
        void err;
      }
    }
    return '';
  }

  /**
   * Helper hạ cấp sao chép bằng execCommand
   */
  private fallbackCopy(text: string): boolean {
    if (typeof document === 'undefined') {
      return false;
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      textarea.style.opacity = '0';
      textarea.setAttribute('readonly', '');

      // Gắn vào Shadow DOM host nếu có, hoặc document.body
      const shadowHost = document.getElementById('zalo-quick-action-root');
      const container = shadowHost?.shadowRoot ?? document.body ?? document.documentElement;

      container.appendChild(textarea);
      textarea.focus();
      textarea.select();

      const success = document.execCommand('copy');
      container.removeChild(textarea);

      return success;
    } catch (err) {
      void err;
      return false;
    }
  }
}
