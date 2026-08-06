// Content Zalo DOM Helper Module: Core DOM Utilities & Event Simulation for Zalo Web
(function () {
  'use strict';

  window.ZaloQuickActionDOM = {
    // Check if current page is Zalo Web
    isZaloWeb() {
      return window.location.hostname.includes('zalo.me');
    },

    // Simulate full sequence of mouse click events on an element
    simulateClick(element) {
      if (!element) return;
      
      const target = element.closest('button, div[role="button"], a, [class*="btn"], [class*="button"]') || element;
      if (window.ZaloQuickActionLogger) {
        window.ZaloQuickActionLogger.info('ZaloDOM', 'Simulating click sequence on target element', { targetTagName: target.tagName, className: target.className });
      }
      
      const events = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
      events.forEach(evtName => {
        const evt = new MouseEvent(evtName, {
          bubbles: true,
          cancelable: true,
          view: window
        });
        target.dispatchEvent(evt);
      });
      if (typeof target.click === 'function') {
        target.click();
      }
    },

    // Re-check a message container if clicking/selecting text unticked it in multi-select mode
    tryRecheckMessageFromNode(node) {
      if (!this.isZaloWeb() || !node) return false;

      const targetEl = node.nodeType === 3 ? node.parentElement : node;
      const msgItem = targetEl ? targetEl.closest('[class*="msg-item"], [class*="chat-item"], .msg-body, [data-id*="msg"], div[role="row"]') : null;
      if (!msgItem) return false;

      // Find selection checkbox or tick circle within or next to msgItem
      const checkbox = msgItem.querySelector('input[type="checkbox"], [class*="checkbox"], [class*="check"], svg[class*="check"]');
      if (checkbox) {
        const isChecked = checkbox.checked || checkbox.classList.contains('active') || checkbox.getAttribute('aria-checked') === 'true' || msgItem.classList.contains('selected');
        if (!isChecked) {
          if (window.ZaloQuickActionLogger) {
            window.ZaloQuickActionLogger.info('ZaloDOM', '🔄 Re-checking message unticked by text selection click');
          }
          this.simulateClick(checkbox);
          return true;
        }
      }
      return false;
    }
  };
})();
