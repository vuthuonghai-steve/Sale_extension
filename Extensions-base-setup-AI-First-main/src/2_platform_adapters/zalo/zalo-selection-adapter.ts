import type {
  IZaloSelectionCapturedRaw,
  IZaloSelectionDOMAdapter,
  IZaloSelectionDOMRect,
} from '../../0_contracts/zalo-selection.contract';

/**
 * Selectors Cấp 1: Khung hội thoại Zalo Web hợp lệ (mở rộng nhận diện mọi biến thể React DOM của Zalo)
 */
const VALID_CHAT_VIEW_SELECTORS =
  '#chatView, .chat-view, .chat-message-list, .main-tab-chats, [role="log"], [class*="chat"], [class*="message"], [class*="bubble"], [class*="card"], [class*="conv"], div[data-id], #chat_box, .message-view, .chat-content, #app';

/**
 * Selectors Cấp 2: Vùng cấm (Khung nhập liệu, ô tìm kiếm, menu cài đặt)
 */
const EXCLUDED_INPUT_AREA_SELECTORS =
  '#input_chat, [contenteditable="true"], .chat-input, .search-bar, .setting-menu, textarea, input';

/**
 * Selectors Cấp 3: Thẻ container bong bóng tin nhắn target (đồng bộ chuẩn xác từ Achive/zalo_quick_action)
 */
const TARGET_MESSAGE_CONTAINER_SELECTORS =
  '[class*="msg-item"], [class*="chat-item"], [data-id*="msg"], div[data-id], .msg-item, div[role="row"], div[class*="message"], div[class*="bubble"], div[class*="msg"], div[class*="card"]';

/**
 * Layer 2 — Platform Adapter thực thi truy vấn và bóc tách DOM API trực tiếp trên Zalo Web.
 * Chịu trách nhiệm tương tác với window.getSelection(), Range API và traversal DOM.
 */
export class ZaloSelectionDOMAdapter implements IZaloSelectionDOMAdapter {
  private lastHoveredElement: Element | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener(
        'mousemove',
        (e: MouseEvent) => {
          this.lastHoveredElement = e.target as Element | null;
        },
        { passive: true }
      );
    }
  }

  /**
   * Lấy phần tử DOM đang được con trỏ chuột hover hiện tại
   */
  public getHoveredElement(): Element | null {
    return this.lastHoveredElement;
  }

  /**
   * Đọc và chụp trạng thái bôi đen hiện tại từ window.getSelection()
   */
  public captureCurrentSelection(): IZaloSelectionCapturedRaw | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const selection = window.getSelection ? window.getSelection() : null;
    let selectedText = '';
    let anchorNode: Node | null = null;
    let commonAncestorElement: Element | null = null;
    let boundingClientRect: IZaloSelectionDOMRect | null = null;

    if (selection && selection.rangeCount > 0) {
      selectedText = selection.toString();
      const range = selection.getRangeAt(0);
      anchorNode = range.commonAncestorContainer;
      if (anchorNode) {
        commonAncestorElement =
          anchorNode.nodeType === 3
            ? anchorNode.parentElement
            : (anchorNode as Element);
      }
      if (range.getBoundingClientRect) {
        const rect = range.getBoundingClientRect();
        boundingClientRect = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };
      }
    }

    // Fallback sang Hovered Element nếu người dùng không bôi đen mà hover chuột
    if (!commonAncestorElement && this.lastHoveredElement) {
      commonAncestorElement = this.lastHoveredElement;
    }

    if (!selectedText && !commonAncestorElement) {
      return null;
    }

    return {
      selectedText,
      anchorNode,
      commonAncestorElement,
      boundingClientRect,
    };
  }

  /**
   * Leo ngược cây DOM từ thẻ anchorElement tới bong bóng tin nhắn Zalo target
   */
  public findClosestMessageElement(anchorElement: Element | null): Element | null {
    if (!anchorElement) {
      return null;
    }

    return anchorElement.closest(TARGET_MESSAGE_CONTAINER_SELECTORS);
  }

  /**
   * Kiểm tra xem phẩn tử có nằm trong khu vực Chat View hợp lệ không
   */
  public isWithinChatView(element: Element | null): boolean {
    if (!element) {
      return false;
    }

    return element.closest(VALID_CHAT_VIEW_SELECTORS) !== null;
  }

  /**
   * Kiểm tra xem phẩn tử có thuộc khu vực cấm (Input, Search, Settings) không
   */
  public isInputArea(element: Element | null): boolean {
    if (!element) {
      return false;
    }

    return element.closest(EXCLUDED_INPUT_AREA_SELECTORS) !== null;
  }

  /**
   * Trích xuất messageId từ thuộc tính data-id hoặc id của phần tử tin nhắn
   */
  public extractMessageId(element: Element | null): string | null {
    if (!element) {
      return null;
    }

    const directId = element.getAttribute('data-id');
    if (directId) {
      return directId;
    }

    const nestedId = element.querySelector('[data-id]')?.getAttribute('data-id');
    if (nestedId) {
      return nestedId;
    }

    if (element.id && element.id.includes('msg')) {
      return element.id;
    }

    return null;
  }
}
