// Content Shadow UI Module: Shadow DOM Overlay, Floating Toolbar & Toast Notifications
(function () {
  'use strict';

  let overlayContainer = null;
  let shadowRoot = null;

  function ensureOverlayContainer() {
    if (overlayContainer) return shadowRoot;

    overlayContainer = document.createElement('div');
    overlayContainer.id = 'zalo-quick-action-root';
    overlayContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 0;
      height: 0;
      z-index: 2147483647;
      pointer-events: none;
    `;

    shadowRoot = overlayContainer.attachShadow({ mode: 'open' });
    document.body.appendChild(overlayContainer);

    const style = document.createElement('style');
    style.textContent = `
      .floating-bar {
        pointer-events: auto;
        position: fixed;
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(15, 23, 42, 0.94);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(56, 189, 248, 0.4);
        border-radius: 30px;
        padding: 5px 10px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4), 0 0 15px rgba(56, 189, 248, 0.25);
        z-index: 2147483647;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 12px;
        animation: fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        transition: opacity 0.2s ease, transform 0.2s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(6px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      .btn-action {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: rgba(255, 255, 255, 0.08);
        color: #f8fafc;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 20px;
        padding: 4px 10px;
        font-weight: 600;
        font-size: 11px;
        cursor: pointer;
        white-space: nowrap;
        user-select: none;
        transition: all 0.15s ease;
      }

      .btn-action:hover {
        background: rgba(56, 189, 248, 0.25);
        color: #38bdf8;
        border-color: rgba(56, 189, 248, 0.5);
      }

      .btn-primary {
        background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
        color: #ffffff;
        border: none;
      }

      .btn-primary:hover {
        background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
        box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
      }

      .btn-close {
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        font-size: 14px;
        padding: 2px 6px;
        border-radius: 50%;
        line-height: 1;
      }
      .btn-close:hover { color: #f87171; background: rgba(239, 68, 68, 0.15); }

      .toast-notice {
        pointer-events: auto;
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: rgba(15, 23, 42, 0.96);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(56, 189, 248, 0.5);
        color: #e0f2fe;
        padding: 10px 16px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        z-index: 2147483647;
        animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      @keyframes slideUp {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .dev-error-alert {
        pointer-events: auto;
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 420px;
        background: rgba(15, 23, 42, 0.98);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(248, 113, 113, 0.6);
        box-shadow: 0 10px 30px rgba(239, 68, 68, 0.25), 0 0 20px rgba(0, 0, 0, 0.6);
        border-radius: 12px;
        padding: 14px 16px;
        color: #f8fafc;
        font-family: monospace, monospace;
        font-size: 12px;
        z-index: 2147483647;
        animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .dev-error-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(248, 113, 113, 0.3);
        padding-bottom: 6px;
        margin-bottom: 8px;
        font-weight: bold;
        color: #f87171;
      }
      .dev-error-body {
        max-height: 180px;
        overflow-y: auto;
        word-break: break-word;
        white-space: pre-wrap;
        color: #cbd5e1;
        font-size: 11px;
      }
    `;
    shadowRoot.appendChild(style);
    return shadowRoot;
  }

  window.ZaloQuickActionUI = {
    isOverlayTarget(target) {
      return overlayContainer && overlayContainer.contains(target);
    },

    showDevErrorModal({ scope, message, data }) {
      const root = ensureOverlayContainer();
      const oldModal = root.querySelector('.dev-error-alert');
      if (oldModal) oldModal.remove();

      const alertBox = document.createElement('div');
      alertBox.className = 'dev-error-alert';
      
      const formattedData = data ? (typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)) : '';

      alertBox.innerHTML = `
        <div class="dev-error-header">
          <span>🚨 DEV ALERT [${scope}]</span>
          <button class="btn-close" id="btnCloseDevAlert">×</button>
        </div>
        <div class="dev-error-body">
          <div style="font-weight: 600; margin-bottom: 4px; color: #fca5a5;">${message}</div>
          ${formattedData ? `<pre style="margin: 0; background: rgba(0,0,0,0.4); padding: 6px; border-radius: 6px;">${formattedData}</pre>` : ''}
        </div>
      `;

      root.appendChild(alertBox);

      alertBox.querySelector('#btnCloseDevAlert').onclick = () => {
        alertBox.remove();
      };
    },

    showToast(message) {
      if (!window.ZaloQuickActionConfig.get('toastEnabled')) return;
      const root = ensureOverlayContainer();

      const oldToast = root.querySelector('.toast-notice');
      if (oldToast) oldToast.remove();

      const toast = document.createElement('div');
      toast.className = 'toast-notice';
      toast.innerHTML = `<span>${message}</span>`;

      root.appendChild(toast);
      setTimeout(() => { if (toast && toast.isConnected) toast.remove(); }, 3000);
    },

    showToolbar(rect, handlers) {
      if (!window.ZaloQuickActionConfig.get('enableFloatingToolbar')) return;
      const root = ensureOverlayContainer();

      this.hideToolbar();

      const bar = document.createElement('div');
      bar.className = 'floating-bar';

      const topPos = Math.max(10, rect.top - 48);
      const leftPos = Math.min(window.innerWidth - 220, Math.max(10, rect.left + (rect.width / 2) - 100));

      bar.style.top = `${topPos}px`;
      bar.style.left = `${leftPos}px`;

      bar.innerHTML = `
        <button class="btn-action btn-primary" id="btnZaloShare">
          🚀 Chia sẻ Zalo
        </button>
        <button class="btn-action" id="btnCleanCopy">
          📋 Copy
        </button>
        <button class="btn-close" id="btnCloseBar">×</button>
      `;

      root.appendChild(bar);

      bar.querySelector('#btnZaloShare').onclick = (e) => {
        e.stopPropagation();
        if (handlers.onShare) handlers.onShare();
      };

      bar.querySelector('#btnCleanCopy').onclick = (e) => {
        e.stopPropagation();
        if (handlers.onCopy) handlers.onCopy();
      };

      bar.querySelector('#btnCloseBar').onclick = (e) => {
        e.stopPropagation();
        this.hideToolbar();
      };
    },

    hideToolbar() {
      if (shadowRoot) {
        const bar = shadowRoot.querySelector('.floating-bar');
        if (bar) bar.remove();
      }
    }
  };
})();
