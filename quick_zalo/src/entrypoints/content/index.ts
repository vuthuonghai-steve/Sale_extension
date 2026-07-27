import { createContentContainer } from '@composition/content-container';
import { ZaloDomObserver } from '@infra/extraction/zalo-dom-observer';

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
    const { extractDom } = createContentContainer();
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
        onMessageExtracted: (zaloMsg) => {
          console.log('[ContentScript] Extracted Zalo Message:', zaloMsg);
          void browser.runtime.sendMessage({
            type: 'event',
            name: 'zalo.message.extracted',
            payload: zaloMsg,
          });
        },
      });

      observer.start();

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
        if (msg.payload?.enabled) {
          observer.start();
        } else {
          observer.stop();
        }
        sendResponse({ ok: true, data: { enabled: msg.payload?.enabled } });
      }

      return true;
    });
  },
});
