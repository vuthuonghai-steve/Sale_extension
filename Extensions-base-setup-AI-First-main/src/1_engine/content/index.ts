import { defineContentScript } from '#imports';
import { ZaloQuickActionOrchestrator } from '@presentation/content/zalo-quick-action-orchestrator';

/**
 * Layer 1 Engine — WXT Content Script Entrypoint cho Zalo Web.
 * Khai báo content script match https://*.zalo.me/* và https://chat.zalo.me/* (MV3).
 * Khởi tạo ZaloQuickActionOrchestrator tại Layer 4 Presentation.
 */
export default defineContentScript({
  matches: ['https://*.zalo.me/*', 'https://chat.zalo.me/*', 'http://127.0.0.1/*', 'http://localhost/*'],
  runAt: 'document_idle',
  main() {
    const orchestrator = new ZaloQuickActionOrchestrator();
    void orchestrator.init();
    if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
      document.documentElement.setAttribute('data-wxt-ext-id', chrome.runtime.id);
    }
  },
});

// Auto-init khi nạp trong môi trường trình duyệt thực tế
if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
  if (!window.__zalo_qa_orchestrator__) {
    const orchestrator = new ZaloQuickActionOrchestrator();
    window.__zalo_qa_orchestrator__ = orchestrator;
    void orchestrator.init();
    if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
      document.documentElement.setAttribute('data-wxt-ext-id', chrome.runtime.id);
    }
  }
}
