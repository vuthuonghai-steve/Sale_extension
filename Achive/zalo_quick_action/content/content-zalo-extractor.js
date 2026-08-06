// Content Zalo Message Extractor Module: Extracting Text Content from Zalo Web DOM
(function () {
  'use strict';

  window.ZaloQuickActionExtractor = {
    // Extract text content from currently selected multi-select messages if user didn't highlight text manually
    getSelectedMessagesText() {
      const DOM = window.ZaloQuickActionDOM;
      if (!DOM || !DOM.isZaloWeb()) return '';

      const selectedItems = Array.from(document.querySelectorAll('[class*="selected"], [aria-checked="true"], .msg-item.active'));
      const quoteSelectors = ['[class*="quote"]', '[class*="reply"]', '[class*="rel-msg"]', '[class*="reference"]', '[class*="quoted"]', '[data-id*="quote"]'];

      for (const item of selectedItems) {
        const cloned = item.cloneNode(true);
        const quoteEls = cloned.querySelectorAll(quoteSelectors.join(', '));
        quoteEls.forEach(el => el.remove());

        const txt = cloned.textContent ? cloned.textContent.trim() : '';
        if (txt && txt.length > 5 && !txt.includes('http')) {
          return txt;
        }
      }
      return '';
    },

    // Extract full text content of a Zalo Web message when any part of it is highlighted/selected
    getFullMessageFromSelection() {
      const DOM = window.ZaloQuickActionDOM;
      if (!DOM || !DOM.isZaloWeb()) return '';

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return '';

      const range = selection.getRangeAt(0);
      const selectedNode = range.commonAncestorContainer;
      const element = selectedNode.nodeType === 3 ? selectedNode.parentElement : selectedNode;

      if (!element) return '';

      // 1. Tìm container bong bóng tin nhắn tổng (msg-item)
      let msgItem = element.closest(
        '[class*="msg-item"], [class*="chat-item"], [data-id*="msg"], div[data-id], .msg-item'
      );

      if (!msgItem) {
        msgItem = element.closest('div[class*="message"], div[class*="bubble"], div[class*="msg"]');
      }

      // 2. Trong msgItem, ưu tiên lấy thẻ chứa trực tiếp phần văn bản (tránh dính tên người gửi/thời gian)
      let textContainer = null;
      if (msgItem) {
        textContainer = msgItem.querySelector(
          '[class*="text-content"], [class*="msg-text"], [class*="card-content"], [class*="msg-content"], [class*="bubble"]'
        );
      }

      // 3. Fallback: Nếu không có textContainer riêng, lấy msgItem hoặc thẻ closest từ element bôi đen
      const msgContainer = textContainer || msgItem || element.closest(
        '[class*="card-content"], [class*="text-content"], [class*="msg-content"], [class*="msg-item"], [class*="msg-view"], div[data-id]'
      );

      if (!msgContainer) {
        if (window.ZaloQuickActionLogger) {
          window.ZaloQuickActionLogger.warn('ZaloExtractor', 'Selection node outside known Zalo message container');
        }
        return '';
      }

      // 4. Clone container để loại bỏ bớt phần tử trích dẫn reply quote banner mà không làm ảnh hưởng DOM trang gốc
      const clonedContainer = msgContainer.cloneNode(true);
      const quoteSelectors = [
        '[class*="quote"]',
        '[class*="reply"]',
        '[class*="rel-msg"]',
        '[class*="reference"]',
        '[class*="quoted"]',
        '[data-id*="quote"]'
      ];
      const quoteElements = clonedContainer.querySelectorAll(quoteSelectors.join(', '));
      quoteElements.forEach(el => el.remove());

      let fullText = clonedContainer.innerText || clonedContainer.textContent || '';
      fullText = fullText.replace(/\n?Xem thêm$/i, '').trim();

      if (window.ZaloQuickActionLogger) {
        window.ZaloQuickActionLogger.success('ZaloExtractor', '🎯 Successfully extracted full message container text from DOM selection (quote stripped)', {
          highlightedFragment: selection.toString().trim(),
          containerClass: msgContainer.className,
          extractedLength: fullText.length,
          extractedTextPreview: fullText.substring(0, 120) + (fullText.length > 120 ? '...' : '')
        });
      }

      return fullText;
    }
  };
})();
