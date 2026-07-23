// Content Zalo Web Automation Adapter Module: Interacting with Zalo Web DOM
(function () {
  'use strict';

  window.ZaloQuickActionAdapter = {
    isZaloWeb() {
      return window.location.hostname.includes('zalo.me');
    },

    // Simulate full sequence of mouse click events on an element
    simulateClick(element) {
      if (!element) return;
      
      const target = element.closest('button, div[role="button"], a') || element;
      console.log('[ZaloAdapter Diagnostic] 🖱️ Simulating click sequence on target element:', target);
      
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

    // Robust Trigger for Multi-Select Share Bar on Zalo Web with Detailed Diagnostic Logging
    async tryTriggerMultiSelectShare() {
      if (!this.isZaloWeb()) {
        console.log('[ZaloAdapter Diagnostic] ℹ️ Not on zalo.me domain.');
        return false;
      }

      console.group('🔍 [ZaloAdapter Diagnostic] Multi-Select Share Search Triggered');
      console.log('Timestamp:', new Date().toISOString());
      console.log('Current URL:', window.location.href);

      // Retry loop to handle Zalo Web DOM animation/transition
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`--- Scan Attempt ${attempt}/3 ---`);

        // 1. Detect if Zalo Web is in Multi-Select Mode (e.g. contains "Đã chọn")
        const allTextNodes = Array.from(document.querySelectorAll('div, span, p, b, strong, button, a, div[class]'));
        const selectedCounterEl = allTextNodes.find(el => {
          const txt = el.textContent ? el.textContent.trim() : '';
          return (txt.includes('Đã chọn') || txt.includes('selected')) && el.offsetWidth > 0 && el.offsetHeight > 0;
        });

        const isMultiSelectActive = !!selectedCounterEl;
        console.log(`Multi-select counter detected ("Đã chọn"):`, isMultiSelectActive, selectedCounterEl);

        // 2. Scan all visible clickable candidates on DOM
        const candidateEls = Array.from(document.querySelectorAll('button, div, span, a, i, svg, [title], [aria-label]'));
        console.log(`Total candidate DOM elements scanned: ${candidateEls.length}`);

        const matchingEls = candidateEls.filter(el => {
          if (!el || el.offsetWidth === 0 || el.offsetHeight === 0) return false;
          if (el.tagName === 'BODY' || el.tagName === 'HTML' || el.id === 'app' || el.id === 'root') return false;

          const txt = el.textContent ? el.textContent.trim() : '';
          const title = el.getAttribute('title') || el.getAttribute('aria-label') || '';

          const hasText = (txt.includes('Chia sẻ') || txt.includes('Share')) && txt.length < 40;
          const hasTitle = /chia\s*sẻ|share/i.test(title);

          return hasText || hasTitle;
        });

        console.log(`Matching Share elements found (${matchingEls.length}):`, matchingEls.map(el => ({
          tag: el.tagName,
          text: el.textContent.trim(),
          title: el.getAttribute('title'),
          class: el.className,
          rect: `${el.offsetWidth}x${el.offsetHeight}`
        })));

        if (matchingEls.length > 0) {
          // Sort by smallest element area (leaf node preference)
          matchingEls.sort((a, b) => (a.offsetWidth * a.offsetHeight) - (b.offsetWidth * b.offsetHeight));
          const targetBtn = matchingEls[0];

          console.log('🎯 SELECTED TARGET BUTTON TO CLICK:', targetBtn);
          console.groupEnd();

          this.simulateClick(targetBtn);
          return true;
        }

        // 3. Fallback: Search for SVG icon buttons or title/aria-label attributes
        const iconShareBtns = Array.from(document.querySelectorAll('[title*="Chia sẻ"], [title*="Share"], [aria-label*="Chia sẻ"], [aria-label*="Share"], .fa-share, .icon-share, [class*="share"]'));
        const visibleIconBtn = iconShareBtns.find(el => el.offsetWidth > 0 && el.offsetHeight > 0);

        if (visibleIconBtn) {
          console.log('🎯 FOUND ICON SHARE BUTTON:', visibleIconBtn);
          console.groupEnd();
          this.simulateClick(visibleIconBtn);
          return true;
        }

        if (isMultiSelectActive && attempt < 3) {
          console.log('⏳ Multi-select bar detected but Share button not ready yet. Waiting 120ms for DOM render...');
          await new Promise(r => setTimeout(r, 120));
        }
      }

      console.warn('❌ [ZaloAdapter Diagnostic] Multi-Select Share search failed after 3 attempts.');
      console.groupEnd();
      return false;
    },

    // Direct DOM Automation for Single Message or Chat Input
    tryTriggerWebShare(cleanedText) {
      if (!this.isZaloWeb()) return false;

      console.group('🔍 [ZaloAdapter Diagnostic] Single Text Web Share Triggered');
      console.log('Text to inject:', cleanedText);

      // 1. Try active chat input box in Zalo Web
      const chatInput = document.querySelector('#input_chat_topic') ||
                        document.querySelector('[contenteditable="true"]') ||
                        document.querySelector('.chat-input');

      if (chatInput && cleanedText) {
        chatInput.focus();
        try {
          if (chatInput.isContentEditable) {
            document.execCommand('insertText', false, cleanedText);
          } else if (chatInput.tagName === 'TEXTAREA' || chatInput.tagName === 'INPUT') {
            chatInput.value = cleanedText;
            chatInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
          console.log('✅ Injected text into chat input:', chatInput);
          console.groupEnd();
          return true;
        } catch (e) {
          console.warn('Failed to inject text into chat input:', e);
        }
      }

      // 2. Try share icon on hovered message
      const shareBtns = document.querySelectorAll('[title*="Chia sẻ"], [title*="Share"], .fa-share, .icon-share');
      if (shareBtns.length > 0) {
        const lastShareBtn = shareBtns[shareBtns.length - 1];
        console.log('✅ Triggering share icon on message:', lastShareBtn);
        console.groupEnd();
        this.simulateClick(lastShareBtn);
        return true;
      }

      console.warn('❌ Could not locate active chat input or share icons on Zalo Web.');
      console.groupEnd();
      return false;
    }
  };
})();
