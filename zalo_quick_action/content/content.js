// Content Script: Main Orchestrator & Event Listener Bridge
(function () {
  'use strict';

  let currentSelectedText = '';

  // Variable A Storage Helper Functions (Persisted in chrome.storage.local for cross-tab sharing)
  async function getVariableA() {
    return new Promise((resolve) => {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime?.id && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(['variableA'], (res) => {
            if (chrome.runtime?.lastError) {
              resolve(window.ZaloQuickActionVariableA || null);
            } else {
              resolve(res ? res.variableA : (window.ZaloQuickActionVariableA || null));
            }
          });
        } else {
          resolve(window.ZaloQuickActionVariableA || null);
        }
      } catch (e) {
        resolve(window.ZaloQuickActionVariableA || null);
      }
    });
  }

  async function setVariableA(val) {
    window.ZaloQuickActionVariableA = val;
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime?.id && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ variableA: val });
      }
    } catch (e) {
      // Gracefully ignore extension context invalidation
    }
  }

  async function clearVariableA() {
    window.ZaloQuickActionVariableA = null;
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime?.id && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.remove('variableA');
      }
    } catch (e) {
      // Gracefully ignore extension context invalidation
    }
  }

  // 1. Zalo Share Core Action Orchestrator
  async function executeZaloShare(text) {
    const isZalo = window.ZaloQuickActionAdapter.isZaloWeb();

    // Check Multi-Select Mode on Zalo Web
    if (isZalo && (await window.ZaloQuickActionAdapter.tryTriggerMultiSelectShare())) {
      if (window.ZaloQuickActionLogger) {
        window.ZaloQuickActionLogger.success('Orchestrator', 'Multi-Select Share triggered on Zalo Web');
      }
      window.ZaloQuickActionUI.showToast('🚀 Đã kích hoạt Chia sẻ [Nhiều tin nhắn & Ảnh] trên Zalo Web!');
      window.ZaloQuickActionUI.hideToolbar();
      return;
    }

    const cleaned = window.ZaloQuickActionText.clean(text);
    if (!cleaned) {
      if (window.ZaloQuickActionLogger) {
        window.ZaloQuickActionLogger.warn('Orchestrator', 'Neither Multi-Select Share nor valid text selection was available');
      }
      if (isZalo) {
        window.ZaloQuickActionUI.showToast('💡 Đang ở Zalo Web: Vui lòng bôi đen đoạn văn bản hoặc chọn tin nhắn để Chia sẻ (Alt+S)');
      } else {
        window.ZaloQuickActionUI.showToast('⚠️ Vui lòng bôi đen văn bản cần chuyển tiếp!');
      }
      return;
    }

    // Copy to Clipboard (Checks autoCopyOnShare config)
    const autoCopyEnabled = window.ZaloQuickActionConfig ? window.ZaloQuickActionConfig.get('autoCopyOnShare') !== false : true;
    if (autoCopyEnabled) {
      try {
        await navigator.clipboard.writeText(cleaned);
        window.ZaloQuickActionLogger.info('Orchestrator', 'Text copied to clipboard successfully', { textLength: cleaned.length });
      } catch (err) {
        window.ZaloQuickActionLogger.error('Orchestrator', 'Failed to copy text to clipboard', err);
      }
    }

    if (isZalo) {
      const shareSuccess = window.ZaloQuickActionAdapter.tryTriggerWebShare(cleaned);
      if (shareSuccess) {
        window.ZaloQuickActionUI.showToast('🚀 Đã kích hoạt chuyển tiếp trên Zalo Web!');
      } else {
        window.ZaloQuickActionUI.showToast('📋 Đã chép nội dung tin nhắn! Dán (Ctrl+V) vào ô chat nhóm Zalo.');
      }
    } else {
      window.ZaloQuickActionUI.showToast('🚀 Đã chép nội dung & chuẩn bị chuyển tiếp Zalo Web (Alt+S)');
    }

    window.ZaloQuickActionUI.hideToolbar();
  }

  // Helper to resolve text: prefers full Zalo Web message if selection is inside a Zalo message container
  function resolveText(providedText) {
    if (window.ZaloQuickActionAdapter && window.ZaloQuickActionAdapter.isZaloWeb()) {
      const fullMsg = window.ZaloQuickActionAdapter.getFullMessageFromSelection();
      if (fullMsg && fullMsg.length > 0) {
        if (window.ZaloQuickActionLogger) {
          window.ZaloQuickActionLogger.info('Orchestrator', 'Resolved full Zalo message text from DOM selection', {
            originalSelectionLength: (providedText || '').length,
            extractedMessageLength: fullMsg.length
          });
        }
        return fullMsg;
      }
    }
    return providedText || (window.getSelection() ? window.getSelection().toString().trim() : currentSelectedText);
  }

  // 2. Alt + S Smart Share (Prioritizes Variable A if set)
  async function executeSmartZaloShare(text) {
    const targetText = resolveText(text);
    const varA = await getVariableA();
    if (varA) {
      if (window.ZaloQuickActionLogger) {
        window.ZaloQuickActionLogger.info('Orchestrator', 'Consuming Variable A for Alt+S into Share Modal', { variableA: varA });
      }
      const isZalo = window.ZaloQuickActionAdapter.isZaloWeb();

      if (isZalo) {
        // Trigger Share Modal action first (e.g. multi-select share or active message share)
        await window.ZaloQuickActionAdapter.tryTriggerMultiSelectShare();

        // Inject Variable A into the Share Modal's search input box ("<input placeholder='Tìm kiếm...'>")
        const injected = await window.ZaloQuickActionAdapter.tryInjectShareModalSearchInput(varA);
        if (injected) {
          window.ZaloQuickActionUI.showToast(`🚀 Đã nhập biến A ("${varA}") vào ô tìm kiếm Chia sẻ!`);
        } else {
          window.ZaloQuickActionUI.showToast(`⚠️ Chưa tìm thấy ô tìm kiếm trong popup Chia sẻ Zalo.`);
        }
      } else {
        window.ZaloQuickActionUI.showToast(`📌 Đã lưu biến A ("${varA}"). Vui lòng chuyển sang Zalo Web & bấm Alt+S.`);
      }

      // Clear Variable A after consumption (without touching clipboard)
      await clearVariableA();
      window.ZaloQuickActionUI.hideToolbar();
      return;
    }

    // Fallback: Standard selection share if variable A is empty
    await executeZaloShare(targetText);
  }

  // 3. District Lookup Action (Alt + A) - Auto Lookup District & Copy Sanitized Message
  async function executeDistrictLookupA(text) {
    const targetText = resolveText(text);
    const selection = window.getSelection();
    let query = targetText;

    // Fallback: If no highlighted text, attempt to auto-read text from currently selected multi-select messages on Zalo Web
    if (!query && window.ZaloQuickActionAdapter) {
      query = window.ZaloQuickActionAdapter.getSelectedMessagesText();
    }

    if (!query) {
      window.ZaloQuickActionUI.showToast('⚠️ Vui lòng bôi đen văn bản để xác định Quận/Huyện & Copy (Alt+A)');
      return;
    }

    // 1. Tự động lọc sạch văn bản & Sao chép vào Clipboard (Kiểm tra cấu hình autoCopyOnShare)
    const cleanedMessage = window.ZaloQuickActionText ? window.ZaloQuickActionText.clean(query) : query;
    let copiedSuccess = false;

    const autoCopyEnabled = window.ZaloQuickActionConfig ? window.ZaloQuickActionConfig.get('autoCopyOnShare') !== false : true;

    if (cleanedMessage && autoCopyEnabled) {
      try {
        await navigator.clipboard.writeText(cleanedMessage);
        copiedSuccess = true;
        if (window.ZaloQuickActionLogger) {
          window.ZaloQuickActionLogger.success('Clipboard', '📋 Alt+A: Successfully copied sanitized message to clipboard', {
            originalLength: query.length,
            sanitizedLength: cleanedMessage.length,
            copiedPreview: cleanedMessage.substring(0, 100) + '...'
          });
        }
      } catch (err) {
        if (window.ZaloQuickActionLogger) {
          window.ZaloQuickActionLogger.error('Clipboard', 'Alt+A: Failed to copy sanitized message to clipboard', err);
        }
      }
    }

    // 2. Tra cứu Quận/Huyện & Lưu vào Biến A
    if (!window.ZaloAdminLookup) {
      window.ZaloQuickActionUI.showToast(copiedSuccess ? '📋 Đã sao chép tin nhắn! (⚠️ Bộ tra cứu địa chính chưa sẵn sàng)' : '⚠️ Bộ tra cứu địa chính chưa sẵn sàng. Thử lại sau 1s.');
      return;
    }

    await window.ZaloAdminLookup.ensureData();
    const district = window.ZaloAdminLookup.lookupDistrict(query);

    if (district) {
      await setVariableA(district);
      window.ZaloQuickActionUI.showToast(
        copiedSuccess 
          ? `📌 Đã lưu Biến A: "${district}" & 📋 Đã chép tin nhắn chuẩn hóa!` 
          : `📌 Biến A: "${district}" (Đã lưu từ "${query.length > 25 ? query.substring(0, 25) + '...' : query}")`
      );
    } else {
      window.ZaloQuickActionUI.showToast(
        copiedSuccess 
          ? `📋 Đã sao chép tin nhắn! (⚠️ Không xác định được Quận/Huyện)` 
          : `⚠️ Không xác định được Quận/Huyện từ: "${query.length > 25 ? query.substring(0, 25) + '...' : query}"`
      );
    }

    // Auto Re-check: If highlighting text caused Zalo Web to untick the message container, re-check it immediately
    if (window.ZaloQuickActionAdapter && selection && selection.rangeCount > 0) {
      window.ZaloQuickActionAdapter.tryRecheckMessageFromNode(selection.anchorNode);
    }

    // Clear text selection and reset currentSelectedText after Alt+A to isolate data retrieval from multi-select flow
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
    currentSelectedText = '';

    window.ZaloQuickActionUI.hideToolbar();
  }

  // 4. Clean Copy Action Orchestrator
  async function executeCleanCopy(text) {
    const targetText = resolveText(text);
    const cleaned = window.ZaloQuickActionText.clean(targetText);
    if (!cleaned) return;

    try {
      await navigator.clipboard.writeText(cleaned);
      if (window.ZaloQuickActionLogger) {
        window.ZaloQuickActionLogger.success('Clipboard', '📋 Message successfully sanitized & copied to clipboard!', {
          originalLength: targetText.length,
          sanitizedLength: cleaned.length,
          copiedPreview: cleaned
        });
      }
      window.ZaloQuickActionUI.showToast('📋 Đã sao chép & chuẩn hóa toàn bộ tin nhắn!');
    } catch (e) {
      if (window.ZaloQuickActionLogger) {
        window.ZaloQuickActionLogger.error('Clipboard', 'Failed to copy message to clipboard', e);
      }
      window.ZaloQuickActionUI.showToast('❌ Sao chép thất bại!');
    }
    window.ZaloQuickActionUI.hideToolbar();
  }

  // 5. Selection Event Listener
  document.addEventListener('mouseup', (e) => {
    if (window.ZaloQuickActionUI.isOverlayTarget(e.target)) return;

    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : '';

      if (text && text.length >= 2) {
        currentSelectedText = text;
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Tự động kiểm tra và trích xuất tin nhắn đầy đủ ngay khi nhả chuột bôi đen
        let fullExtractedMessage = '';
        let sanitizedMessage = '';

        if (window.ZaloQuickActionAdapter && window.ZaloQuickActionAdapter.isZaloWeb()) {
          fullExtractedMessage = window.ZaloQuickActionAdapter.getFullMessageFromSelection();
          if (fullExtractedMessage && window.ZaloQuickActionText) {
            sanitizedMessage = window.ZaloQuickActionText.clean(fullExtractedMessage);
          }
        }

        if (window.ZaloQuickActionLogger) {
          window.ZaloQuickActionLogger.info('Selection', '🔍 Highlighted text selection detected & sanitized', {
            highlightedFragment: text,
            rawFullMessageLength: fullExtractedMessage ? fullExtractedMessage.length : text.length,
            sanitizedMessageReadyForCopy: sanitizedMessage || (window.ZaloQuickActionText ? window.ZaloQuickActionText.clean(text) : text),
            sanitizedLength: (sanitizedMessage || text).length
          });
        }
        
        window.ZaloQuickActionUI.showToolbar(rect, {
          onShare: () => executeSmartZaloShare(text),
          onDistrictA: () => executeDistrictLookupA(text),
          onCopy: () => executeCleanCopy(text)
        });
      } else {
        window.ZaloQuickActionUI.hideToolbar();
      }
    }, 50);
  });

  // 6. Keyboard Shortcuts Listener
  window.addEventListener('keydown', async (e) => {
    const App = window.ZaloQuickActionApp;

    if (App && App.isShortcut(e, App.SHORTCUTS.CANCEL_UI)) {
      window.ZaloQuickActionUI.hideToolbar();
    } else if (App && App.isShortcut(e, App.SHORTCUTS.DISTRICT_LOOKUP_A)) {
      const selectionText = window.getSelection() ? window.getSelection().toString().trim() : currentSelectedText;
      e.preventDefault();
      await executeDistrictLookupA(selectionText);
    } else if (App && App.isShortcut(e, App.SHORTCUTS.QUICK_SHARE)) {
      const selectionText = window.getSelection() ? window.getSelection().toString().trim() : currentSelectedText;
      e.preventDefault();
      await executeSmartZaloShare(selectionText);
    } else if (!App) {
      // Fallback khi chưa nạp được App config
      if (e.key === 'Escape') {
        window.ZaloQuickActionUI.hideToolbar();
      } else if (e.altKey && (e.key === 'a' || e.key === 'A' || e.code === 'KeyA')) {
        const selectionText = window.getSelection() ? window.getSelection().toString().trim() : currentSelectedText;
        e.preventDefault();
        await executeDistrictLookupA(selectionText);
      } else if (e.altKey && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
        const selectionText = window.getSelection() ? window.getSelection().toString().trim() : currentSelectedText;
        e.preventDefault();
        await executeSmartZaloShare(selectionText);
      }
    }
  });

  // 7. Chrome Runtime Message Listener
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.id && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        const App = window.ZaloQuickActionApp;
        const text = msg.selectedText || (window.getSelection() ? window.getSelection().toString().trim() : currentSelectedText);

        const actionDistrictA = App ? App.ACTIONS.TRIGGER_HOTKEY_DISTRICT_A : 'TRIGGER_HOTKEY_DISTRICT_A';
        const actionShare = App ? App.ACTIONS.EXECUTE_QUICK_SHARE : 'EXECUTE_QUICK_SHARE';
        const actionTriggerShare = App ? App.ACTIONS.TRIGGER_HOTKEY_SHARE : 'TRIGGER_HOTKEY_SHARE';
        const actionCleanCopy = App ? App.ACTIONS.EXECUTE_CLEAN_COPY : 'EXECUTE_CLEAN_COPY';

        if (msg.action === actionDistrictA) {
          executeDistrictLookupA(text);
          if (sendResponse) sendResponse({ status: 'OK' });
        } else if (msg.action === actionShare || msg.action === actionTriggerShare) {
          executeSmartZaloShare(text);
          if (sendResponse) sendResponse({ status: 'OK' });
        } else if (msg.action === actionCleanCopy) {
          executeCleanCopy(text);
          if (sendResponse) sendResponse({ status: 'OK' });
        }
      });
    }
  } catch (e) {
    // Ignore context invalidation
  }

  console.log('[Zalo Quick Action] ✅ Content Main Orchestrator initialized successfully.');
})();
