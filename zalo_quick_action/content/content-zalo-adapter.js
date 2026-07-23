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
      
      const target = element.closest('button, div[role="button"], a, [class*="btn"], [class*="button"]') || element;
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

        // 2. Scan visible elements and prioritize direct text matching ("Chia sẻ" / "Share") as seen in Zalo action bar
        const candidateEls = Array.from(document.querySelectorAll('button, div, span, a, p, b, strong'));
        const textMatchEls = candidateEls.filter(el => {
          if (!el || el.offsetWidth === 0 || el.offsetHeight === 0) return false;
          if (['BODY', 'HTML', 'SCRIPT', 'STYLE'].includes(el.tagName)) return false;
          if (el.id === 'app' || el.id === 'root') return false;

          const txt = (el.textContent || '').trim();
          if (!txt || txt.length > 35) return false;

          const lower = txt.toLowerCase();
          return lower.includes('chia sẻ') || lower.includes('share');
        });

        if (textMatchEls.length > 0) {
          // Sort text matches:
          // 1. Exact match 'chia sẻ' or 'share'
          // 2. Shortest text content (leaf node / button label preferred over outer container)
          // 3. Smallest bounding rect area
          textMatchEls.sort((a, b) => {
            const aTxt = (a.textContent || '').trim().toLowerCase();
            const bTxt = (b.textContent || '').trim().toLowerCase();
            const aExact = (aTxt === 'chia sẻ' || aTxt === 'share') ? 0 : 1;
            const bExact = (bTxt === 'chia sẻ' || bTxt === 'share') ? 0 : 1;
            if (aExact !== bExact) return aExact - bExact;

            if (aTxt.length !== bTxt.length) return aTxt.length - bTxt.length;

            return (a.offsetWidth * a.offsetHeight) - (b.offsetWidth * b.offsetHeight);
          });

          const targetBtn = textMatchEls[0];
          console.log('🎯 SELECTED TARGET BUTTON BY TEXT ("Chia sẻ"):', targetBtn, 'Text:', targetBtn.textContent.trim());
          console.groupEnd();

          this.simulateClick(targetBtn);
          return true;
        }

        // 3. Fallback: Search for SVG icon buttons or title/aria-label attributes if no text button exists
        const iconShareBtns = Array.from(document.querySelectorAll('[title*="Chia sẻ"], [title*="Share"], [aria-label*="Chia sẻ"], [aria-label*="Share"], .fa-share, .icon-share, [class*="share"]'));
        const visibleIconBtn = iconShareBtns.find(el => el.offsetWidth > 0 && el.offsetHeight > 0);

        if (visibleIconBtn) {
          console.log('🎯 FOUND ICON SHARE BUTTON (Fallback):', visibleIconBtn);
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

    // Target and inject text specifically into Zalo Web's "Chia sẻ" (Share Modal Dialog) search input
    async tryInjectShareModalSearchInput(text) {
      if (!text) return false;

      console.group('🔍 [ZaloAdapter Diagnostic] Share Modal Search Input Injection');
      console.log('Text to inject into Share Modal search box:', text);

      // Helper to find the search input inside Zalo's Share modal popup dialog
      const findShareModalInput = () => {
        // 1. Look inside visible modal dialog containers (e.g. "Chia sẻ" dialog)
        const modalContainers = Array.from(document.querySelectorAll('div[role="dialog"], .modal, [class*="modal"], [class*="dialog"], [class*="popup"], [class*="share-modal"]'));
        const visibleModals = modalContainers.filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);

        for (const modal of visibleModals) {
          const input = modal.querySelector('input[placeholder*="Tìm kiếm"], input[placeholder*="Search"], input[type="search"], input[type="text"]');
          if (input && input.offsetWidth > 0 && input.offsetHeight > 0) {
            return input;
          }
        }

        // 2. Search for any visible input element with placeholder "Tìm kiếm..."
        const allInputs = Array.from(document.querySelectorAll('input[placeholder*="Tìm kiếm"], input[placeholder*="Search"], input[placeholder="Tìm kiếm..."]'));
        return allInputs.find(inp => inp.offsetWidth > 0 && inp.offsetHeight > 0) || null;
      };

      // Poll up to 10 attempts (1 second total) to allow Share Modal opening animation to complete
      for (let attempt = 1; attempt <= 10; attempt++) {
        const inputEl = findShareModalInput();
        if (inputEl) {
          console.log(`🎯 Found Share Modal Search Input on attempt ${attempt}:`, inputEl);
          inputEl.focus();

          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          )?.set || Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
          )?.set;

          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(inputEl, text);
          } else {
            inputEl.value = text;
          }

          // Trigger full suite of React/DOM input events
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          inputEl.dispatchEvent(new Event('change', { bubbles: true }));
          inputEl.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13 }));
          inputEl.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13 }));

          console.groupEnd();
          return true;
        }

        await new Promise(r => setTimeout(r, 100));
      }

      console.warn('❌ Could not locate Share Modal Search Input after 10 attempts.');
      console.groupEnd();
      return false;
    },

    // Inject text directly into Zalo Web Search Input Box (#contact-search-input) or active search field
    tryInjectSearchInput(text) {
      if (!text) return false;

      console.group('🔍 [ZaloAdapter Diagnostic] Search Input Injection Triggered');
      console.log('Text to inject into search box:', text);

      // Search input candidates on Zalo Web & general web pages
      const searchSelectors = [
        '#contact-search-input',
        'input[data-id="contact-search-input"]',
        'input[placeholder*="Tìm kiếm"]',
        'input[placeholder*="Search"]',
        'input[placeholder*="tim kiem"]',
        'input[type="search"]',
        '#search-input',
        'input.search-input',
        'input[class*="search"]'
      ];

      let targetInput = null;
      for (const sel of searchSelectors) {
        const el = document.querySelector(sel);
        if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
          targetInput = el;
          break;
        }
      }

      // Fallback: check currently active/focused element or chat input
      if (!targetInput) {
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.isContentEditable)) {
          targetInput = document.activeElement;
        } else {
          targetInput = document.querySelector('#input_chat_topic') ||
                        document.querySelector('[contenteditable="true"]') ||
                        document.querySelector('.chat-input');
        }
      }

      if (targetInput) {
        targetInput.focus();

        try {
          if (targetInput.isContentEditable) {
            document.execCommand('selectAll', false, null);
            document.execCommand('insertText', false, text);
            targetInput.dispatchEvent(new Event('input', { bubbles: true }));
            targetInput.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            // Trigger native input value setter for React compatibility
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              'value'
            )?.set || Object.getOwnPropertyDescriptor(
              window.HTMLTextAreaElement.prototype,
              'value'
            )?.set;

            if (nativeInputValueSetter) {
              nativeInputValueSetter.call(targetInput, text);
            } else {
              targetInput.value = text;
            }

            targetInput.dispatchEvent(new Event('input', { bubbles: true }));
            targetInput.dispatchEvent(new Event('change', { bubbles: true }));

            // Dispatch keyboard enter events to trigger live search filters
            targetInput.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13 }));
            targetInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13 }));
          }
          console.log('✅ Successfully injected text into search/chat input:', targetInput);
          console.groupEnd();
          return true;
        } catch (err) {
          console.error('❌ Failed to inject text into input:', err);
        }
      }

      console.warn('❌ Could not find search input or chat input element on page.');
      console.groupEnd();
      return false;
    },

    // Direct DOM Automation for Single Message or Chat Input
    tryTriggerWebShare(cleanedText) {
      if (!this.isZaloWeb()) return false;

      console.group('🔍 [ZaloAdapter Diagnostic] Single Text Web Share Triggered');
      console.log('Text to inject:', cleanedText);

      // 1. Try search input first if available, else active chat input
      if (this.tryInjectSearchInput(cleanedText)) {
        console.groupEnd();
        return true;
      }

      // 2. Try share button by visible text ("Chia sẻ" / "Share") or title/icon on message
      const candidateBtns = Array.from(document.querySelectorAll('button, div, span, a, [title]'))
        .filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);

      const textShareBtn = candidateBtns.find(el => {
        const txt = (el.textContent || '').trim().toLowerCase();
        return (txt === 'chia sẻ' || txt === 'share') && el.offsetWidth > 0;
      });

      if (textShareBtn) {
        console.log('✅ Triggering share button by text:', textShareBtn);
        console.groupEnd();
        this.simulateClick(textShareBtn);
        return true;
      }

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
          console.log('[ZaloAdapter] 🔄 Re-checking message unticked by text selection click.');
          this.simulateClick(checkbox);
          return true;
        }
      }
      return false;
    },

    // Extract text content from currently selected multi-select messages if user didn't highlight text manually
    getSelectedMessagesText() {
      if (!this.isZaloWeb()) return '';
      const selectedItems = Array.from(document.querySelectorAll('[class*="selected"], [aria-checked="true"], .msg-item.active'));
      for (const item of selectedItems) {
        const txt = item.textContent ? item.textContent.trim() : '';
        if (txt && txt.length > 5 && !txt.includes('http')) {
          return txt;
        }
      }
      return '';
    }
  };
})();
