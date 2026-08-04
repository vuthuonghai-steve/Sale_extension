/**
 * @file entrypoints/content/index.ts
 * @layer WXT Shell Layer (Content Script)
 * @description Điểm khởi chạy (Entrypoint) Content Script tiêm trực tiếp vào trang web (đặc biệt là `chat.zalo.me`).
 *
 * Trách nhiệm chính:
 * - Khởi tạo `ZaloDomObserver` theo dõi biến đổi DOM thời gian thực trên Zalo Web.
 * - Lắng nghe phím tắt `Alt + A` từ người dùng để kích hoạt trích xuất lại khung chat.
 * - Nhận và phản hồi tín hiệu Runtime Messages từ Extension (`SHORTCUT_EXTRACT_CHAT`, `zalo.status.get`, `zalo.messages.rescan`).
 * - Hiển thị thông báo Toast (`showToastNotification`) khi thực thi các tác vụ trích xuất tin nhắn.
 */

import { createContentContainer } from '@composition/content-container';
import { ZaloDomObserver } from '@infra/extraction/zalo-dom-observer';
import { bootstrapQuickSearchContainer } from '@composition/quick-search.container';
import { Evlog } from '../../infra/logging';

function showToastNotification(message: string): void {
  const existing = document.getElementById('quick-zalo-toast');
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'quick-zalo-toast';
  toast.innerText = message;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    backgroundColor: '#0068ff',
    color: '#ffffff',
    padding: '10px 18px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 104, 255, 0.3)',
    fontSize: '13px',
    fontWeight: '600',
    zIndex: '999999',
    transition: 'opacity 0.3s ease',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  });

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

export default defineContentScript({
  matches: ['https://*/*', 'http://*/*'],
  runAt: 'document_idle',
  main() {
    const { extractDom, eventBus, messageRepository, logger } = createContentContainer();
    const isZaloWeb = window.location.hostname.includes('zalo.me');

    let observer: ZaloDomObserver | null = null;

    const handleTriggerExtract = () => {
      if (!observer) return;
      const count = observer.forceScanCurrentChat();
      const conversationName = observer.getActiveConversation();
      showToastNotification(
        `⚡ Quick Zalo: Đã trích xuất ${count} tin nhắn từ [${conversationName || 'Khung chat'}]`
      );
    };

    if (isZaloWeb) {
      console.log('[ContentScript] Initializing Realtime Zalo DOM Observer...');
      observer = new ZaloDomObserver({
        eventBus,
        onMessageExtracted: (zaloMsg) => {
          console.log('[ContentScript] Extracted Zalo Message:', zaloMsg);
          void browser.runtime.sendMessage({
            type: 'event',
            name: 'zalo.message.extracted',
            payload: zaloMsg,
          });
        },
        onMessagesBatchExtracted: (batch) => {
          console.log('[ContentScript] Extracted Zalo Messages Batch:', batch.length);
          void browser.runtime.sendMessage({
            type: 'event',
            name: 'zalo.messages.extracted_batch',
            payload: batch,
          });
        },
        onConversationChanged: (conversationName) => {
          console.log('[ContentScript] Conversation changed to:', conversationName);
          void browser.runtime.sendMessage({
            type: 'event',
            name: 'zalo.conversation.changed',
            payload: { conversationName },
          });
        },
      });

      observer.start();

      bootstrapQuickSearchContainer({ messageRepository, eventBus, logger });
      Evlog.info('@composition/quick-search', 'QuickSearch bootstrapped from content main', {
        isZaloWeb,
      });

      // Listen for Alt + A keydown directly on page
      window.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.altKey && (e.key === 'a' || e.key === 'A')) {
          e.preventDefault();
          handleTriggerExtract();
        }
      });
    }

    browser.runtime.onMessage.addListener((raw, _s, sendResponse) => {
      const msg = raw as {
        name?: string;
        type?: string;
        payload?: { enabled?: boolean };
      };

      if (msg.type === 'SHORTCUT_EXTRACT_CHAT' && isZaloWeb) {
        handleTriggerExtract();
        sendResponse({ ok: true });
        return true;
      }

      if (msg.name === 'dom.extract') {
        sendResponse(extractDom());
      } else if (msg.name === 'zalo.status.get') {
        sendResponse({
          ok: true,
          data: {
            isZaloWeb,
            activeConversation: observer?.getActiveConversation() || '',
          },
        });
      } else if (msg.name === 'zalo.observer.toggle' && observer) {
        const isEnabled = Boolean(msg.payload?.enabled);
        observer.setFullExtractionEnabled(isEnabled);
        if (!observer.isObserving()) {
          observer.start();
        }
        sendResponse({ ok: true, data: { enabled: isEnabled } });
      } else if (msg.name === 'zalo.cache.clear' && observer) {
        observer.clearCache();
        sendResponse({ ok: true });
      } else if (msg.name === 'zalo.messages.rescan' && observer) {
        const count = observer.forceScanCurrentChat(true);
        const conversationName = observer.getActiveConversation();
        showToastNotification(
          `⚡ Quick Zalo: Đã trích xuất lại ${count} tin nhắn từ [${conversationName || 'Khung chat'}]`
        );
        sendResponse({ ok: true, data: { count } });
      }

      return true;
    });
  },
});
