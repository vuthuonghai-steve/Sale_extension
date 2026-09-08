// Content Zalo Share Module: Triggering Share Actions & Input Injections on Zalo Web
(function () {
  'use strict';

  // Mutex & cooldown state for sending separator to prevent duplicate execution
  let isSendingSeparator = false;
  let lastSeparatorSendTime = 0;

  window.ZaloQuickActionShare = {
    // Robust Trigger for Multi-Select Share Bar on Zalo Web
    async tryTriggerMultiSelectShare() {
      const DOM = window.ZaloQuickActionDOM;
      if (!DOM || !DOM.isZaloWeb()) return false;

      // Retry loop to handle Zalo Web DOM animation/transition
      for (let attempt = 1; attempt <= 3; attempt++) {
        // 1. Detect if Zalo Web is in Multi-Select Mode (e.g. contains "Đã chọn")
        const allTextNodes = Array.from(document.querySelectorAll('div, span, p, b, strong, button, a, div[class]'));
        const selectedCounterEl = allTextNodes.find(el => {
          const txt = el.textContent ? el.textContent.trim() : '';
          return (txt.includes('Đã chọn') || txt.includes('selected')) && el.offsetWidth > 0 && el.offsetHeight > 0;
        });

        const isMultiSelectActive = !!selectedCounterEl;

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
          if (window.ZaloQuickActionLogger) {
            window.ZaloQuickActionLogger.success('ZaloShare', '🎯 Triggered Multi-Select Share button by text', { buttonText: targetBtn.textContent.trim() });
          }

          DOM.simulateClick(targetBtn);
          return true;
        }

        // 3. Fallback: Search for SVG icon buttons or title/aria-label attributes if no text button exists
        const iconShareBtns = Array.from(document.querySelectorAll('[title*="Chia sẻ"], [title*="Share"], [aria-label*="Chia sẻ"], [aria-label*="Share"], .fa-share, .icon-share, [class*="share"]'));
        const visibleIconBtn = iconShareBtns.find(el => el.offsetWidth > 0 && el.offsetHeight > 0);

        if (visibleIconBtn) {
          if (window.ZaloQuickActionLogger) {
            window.ZaloQuickActionLogger.success('ZaloShare', '🎯 Triggered Multi-Select Share icon button (Fallback)');
          }
          DOM.simulateClick(visibleIconBtn);
          return true;
        }

        if (isMultiSelectActive && attempt < 3) {
          await new Promise(r => setTimeout(r, 120));
        }
      }

      return false;
    },

    // Target and inject text specifically into Zalo Web's "Chia sẻ" (Share Modal Dialog) search input
    async tryInjectShareModalSearchInput(text) {
      if (!text) return false;

      const findShareModalInput = () => {
        const modalContainers = Array.from(document.querySelectorAll('div[role="dialog"], .modal, [class*="modal"], [class*="dialog"], [class*="popup"], [class*="share-modal"]'));
        const visibleModals = modalContainers.filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);

        for (const modal of visibleModals) {
          const input = modal.querySelector('input[placeholder*="Tìm kiếm"], input[placeholder*="Search"], input[type="search"], input[type="text"]');
          if (input && input.offsetWidth > 0 && input.offsetHeight > 0) {
            return input;
          }
        }

        const allInputs = Array.from(document.querySelectorAll('input[placeholder*="Tìm kiếm"], input[placeholder*="Search"], input[placeholder="Tìm kiếm..."]'));
        return allInputs.find(inp => inp.offsetWidth > 0 && inp.offsetHeight > 0) || null;
      };

      for (let attempt = 1; attempt <= 10; attempt++) {
        const inputEl = findShareModalInput();
        if (inputEl) {
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

          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
          inputEl.dispatchEvent(new Event('change', { bubbles: true }));
          inputEl.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13 }));
          inputEl.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13 }));

          if (window.ZaloQuickActionLogger) {
            window.ZaloQuickActionLogger.success('ZaloShare', 'Injected text into Share Modal search input', { text });
          }
          return true;
        }

        await new Promise(r => setTimeout(r, 100));
      }

      if (window.ZaloQuickActionLogger) {
        window.ZaloQuickActionLogger.warn('ZaloShare', 'Could not locate Share Modal Search Input after 10 attempts');
      }
      return false;
    },

    // Inject text directly into Zalo Web Search Input Box (#contact-search-input) or active search field
    tryInjectSearchInput(text) {
      if (!text) return false;

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

            targetInput.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13 }));
            targetInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13 }));
          }

          if (window.ZaloQuickActionLogger) {
            window.ZaloQuickActionLogger.success('ZaloShare', 'Successfully injected text into search/chat input', { text });
          }
          return true;
        } catch (err) {
          if (window.ZaloQuickActionLogger) {
            window.ZaloQuickActionLogger.error('ZaloShare', 'Failed to inject text into input', err);
          }
        }
      }

      return false;
    },

    // Direct DOM Automation for Single Message or Chat Input
    tryTriggerWebShare(cleanedText) {
      const DOM = window.ZaloQuickActionDOM;
      if (!DOM || !DOM.isZaloWeb()) return false;

      if (this.tryInjectSearchInput(cleanedText)) {
        return true;
      }

      const candidateBtns = Array.from(document.querySelectorAll('button, div, span, a, [title]'))
        .filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);

      const textShareBtn = candidateBtns.find(el => {
        const txt = (el.textContent || '').trim().toLowerCase();
        return (txt === 'chia sẻ' || txt === 'share') && el.offsetWidth > 0;
      });

      if (textShareBtn) {
        if (window.ZaloQuickActionLogger) {
          window.ZaloQuickActionLogger.success('ZaloShare', 'Triggering share button by text', { buttonText: textShareBtn.textContent.trim() });
        }
        DOM.simulateClick(textShareBtn);
        return true;
      }

      const shareBtns = document.querySelectorAll('[title*="Chia sẻ"], [title*="Share"], .fa-share, .icon-share');
      if (shareBtns.length > 0) {
        const lastShareBtn = shareBtns[shareBtns.length - 1];
        if (window.ZaloQuickActionLogger) {
          window.ZaloQuickActionLogger.success('ZaloShare', 'Triggering share icon on message');
        }
        DOM.simulateClick(lastShareBtn);
        return true;
      }

      if (window.ZaloQuickActionLogger) {
        window.ZaloQuickActionLogger.warn('ZaloShare', 'Could not locate active chat input or share icons on Zalo Web');
      }
      return false;
    },

    async sendDirectChatMessage(text) {
      const DOM = window.ZaloQuickActionDOM;
      if (!DOM || !DOM.isZaloWeb() || !text) return false;

      const isSep = /={5,}/.test(text);
      if (isSep) {
        const now = Date.now();
        if (isSendingSeparator || (now - lastSeparatorSendTime < 3000)) {
          if (window.ZaloQuickActionLogger) {
            window.ZaloQuickActionLogger.warn('ZaloShare', '🔒 Mutex/Cooldown active: Separator is already being sent or was sent <3s ago. Dropping duplicate.');
          }
          return false;
        }
        isSendingSeparator = true;
      }

      // 1. Locate the chat input element (#richInput) with retry
      const findChatInput = () => {
        return document.querySelector('#richInput') ||
               document.querySelector('#chatInput [contenteditable]') ||
               document.querySelector('.rich-input') ||
               document.querySelector('[data-keybinding-context*="mainChatInputFocus"]') ||
               document.querySelector('#chat-input-content-id [contenteditable]') ||
               document.querySelector('[contenteditable="true"]');
      };

      let inputEl = findChatInput();
      if (!inputEl) {
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 100));
          inputEl = findChatInput();
          if (inputEl) break;
        }
      }

      if (!inputEl) {
        if (window.ZaloQuickActionLogger) {
          window.ZaloQuickActionLogger.warn('ZaloShare', '❌ Could not find #richInput chat input box on Zalo Web');
        }
        return false;
      }

      try {
        // 2. Ensure contenteditable and activate focus
        if (inputEl.getAttribute('contenteditable') === 'false') {
          inputEl.setAttribute('contenteditable', 'true');
        }

        DOM.simulateClick(inputEl);
        inputEl.focus();

        // Allow Zalo/React to activate input view
        await new Promise(r => setTimeout(r, 80));

        // Re-query input element in case React unmounted and replaced it with a fresh active instance
        inputEl = findChatInput() || inputEl;

        // 3. Set Selection Range inside inputEl safely
        try {
          const selection = window.getSelection();
          if (selection && inputEl && inputEl.isConnected) {
            const range = document.createRange();
            const targetNode = inputEl.lastChild || inputEl;
            range.selectNodeContents(targetNode);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        } catch (rangeErr) {
          // Safe catch: do not let selection range error block paste dispatch
        }

        // 4. Primary Injection: Simulate ClipboardEvent('paste') via DataTransfer (triggers React/Draft.js onChange)
        let pasteDispatched = false;
        try {
          const dt = new DataTransfer();
          dt.setData('text/plain', text);
          dt.setData('text/html', text);

          const pasteEvt = new ClipboardEvent('paste', {
            clipboardData: dt,
            bubbles: true,
            cancelable: true,
            composed: true,
            view: window
          });
          pasteDispatched = inputEl.dispatchEvent(pasteEvt);
        } catch (pasteErr) {
          pasteDispatched = false;
        }

        // 5. Secondary fallback: document.execCommand('insertText')
        const currentTextAfterPaste = (inputEl.textContent || inputEl.innerText || '').trim();
        if (!currentTextAfterPaste.includes(text)) {
          try {
            document.execCommand('insertText', false, text);
          } catch (cmdErr) {
            // Fallback direct innerText if needed
            inputEl.innerText = text;
          }
        }

        // Dispatch input & change events for React listeners
        try {
          inputEl.dispatchEvent(new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertFromPaste',
            data: text
          }));
        } catch (e) {
          inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        }
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));

        // Wait for Zalo/React to re-render toolbar and show Send button (STR_SEND)
        await new Promise(r => setTimeout(r, 150));

        // 6. Locate Send Button (Zalo switches Like button to Send button once text exists)
        const findSendButton = () => {
          return document.querySelector('[data-translate-title="STR_SEND"]') ||
                 document.querySelector('[data-translate-inner="STR_SEND"]') ||
                 document.querySelector('[title*="Gửi"]') ||
                 document.querySelector('[aria-label*="Gửi"]') ||
                 document.querySelector('.btn-send') ||
                 document.querySelector('.chat-box-input__send-btn') ||
                 document.querySelector('.chat-box-input-button[data-translate-title="STR_SEND"]');
        };

        let sendBtn = findSendButton();
        if (!sendBtn) {
          // Poll briefly up to 400ms for React to render Send Button
          for (let i = 0; i < 4; i++) {
            await new Promise(r => setTimeout(r, 100));
            sendBtn = findSendButton();
            if (sendBtn) break;
          }
        }

        if (sendBtn) {
          if (window.ZaloQuickActionLogger) {
            window.ZaloQuickActionLogger.info('ZaloShare', '👉 Clicking Zalo STR_SEND button');
          }
          DOM.simulateClick(sendBtn);
        } else {
          // Fallback: Dispatch Enter key to submit
          if (window.ZaloQuickActionLogger) {
            window.ZaloQuickActionLogger.info('ZaloShare', '⌨️ Dispatching Enter key sequence to #richInput');
          }
          const enterEvents = ['keydown', 'keypress', 'keyup'];
          enterEvents.forEach(type => {
            const enterEvt = new KeyboardEvent(type, {
              bubbles: true,
              cancelable: true,
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13
            });
            inputEl.dispatchEvent(enterEvt);
          });
        }

        if (window.ZaloQuickActionLogger) {
          window.ZaloQuickActionLogger.success('ZaloShare', '✅ Executed auto-send separator message into chat', { text });
        }
        return true;
      } catch (err) {
        if (window.ZaloQuickActionLogger) {
          window.ZaloQuickActionLogger.error('ZaloShare', 'Error while sending direct chat message', err);
        }
        return false;
      } finally {
        if (isSep) {
          lastSeparatorSendTime = Date.now();
          setTimeout(() => {
            isSendingSeparator = false;
          }, 1500);
        }
      }
    }
  };
})();
