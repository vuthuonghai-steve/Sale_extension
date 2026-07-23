// Content Script: Main Orchestrator & Event Listener Bridge
(function () {
  'use strict';

  let currentSelectedText = '';

  // Variable A Storage Helper Functions (Persisted in chrome.storage.local for cross-tab sharing)
  async function getVariableA() {
    return new Promise((resolve) => {
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['variableA'], (res) => {
          resolve(res.variableA || null);
        });
      } else {
        resolve(window.ZaloQuickActionVariableA || null);
      }
    });
  }

  async function setVariableA(val) {
    window.ZaloQuickActionVariableA = val;
    if (chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ variableA: val });
    }
  }

  async function clearVariableA() {
    window.ZaloQuickActionVariableA = null;
    if (chrome.storage && chrome.storage.local) {
      await chrome.storage.local.remove('variableA');
    }
  }

  // 1. Zalo Share Core Action Orchestrator
  async function executeZaloShare(text) {
    console.log('[ZaloOrchestrator Diagnostic] 🚀 executeZaloShare called. Text parameter:', { rawText: text, length: text ? text.length : 0 });
    const isZalo = window.ZaloQuickActionAdapter.isZaloWeb();
    console.log('[ZaloOrchestrator Diagnostic] isZaloWeb:', isZalo);

    // Check Multi-Select Mode on Zalo Web
    if (isZalo && (await window.ZaloQuickActionAdapter.tryTriggerMultiSelectShare())) {
      console.log('[ZaloOrchestrator Diagnostic] ✅ Multi-Select Share succeeded via ZaloAdapter.');
      window.ZaloQuickActionUI.showToast('🚀 Đã kích hoạt Chia sẻ [Nhiều tin nhắn & Ảnh] trên Zalo Web!');
      window.ZaloQuickActionUI.hideToolbar();
      return;
    }

    const cleaned = window.ZaloQuickActionText.clean(text);
    console.log('[ZaloOrchestrator Diagnostic] Cleaned text result:', `"${cleaned}"`);
    if (!cleaned) {
      console.warn('[ZaloOrchestrator Diagnostic] ⚠️ Neither Multi-Select Share nor Text Selection was available. Triggering fallback toast.');
      if (isZalo) {
        window.ZaloQuickActionUI.showToast('💡 Đang ở Zalo Web: Vui lòng bôi đen đoạn văn bản hoặc chọn tin nhắn để Chia sẻ (Alt+S)');
      } else {
        window.ZaloQuickActionUI.showToast('⚠️ Vui lòng bôi đen văn bản cần chuyển tiếp kkkk!');
      }
      return;
    }

    // Copy to Clipboard
    try {
      await navigator.clipboard.writeText(cleaned);
      window.ZaloQuickActionLogger.info('Orchestrator', 'Text copied to clipboard successfully', { textLength: cleaned.length });
    } catch (err) {
      window.ZaloQuickActionLogger.error('Orchestrator', 'Failed to copy text to clipboard', err);
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

  // 2. Alt + S Smart Share (Prioritizes Variable A if set)
  async function executeSmartZaloShare(text) {
    const varA = await getVariableA();
    if (varA) {
      console.log('[ZaloOrchestrator] 🎯 Consuming Variable A for Alt+S into Share Modal:', varA);
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
    await executeZaloShare(text);
  }

  // 3. District Lookup Action (Alt + A)
  async function executeDistrictLookupA(text) {
    const selection = window.getSelection();
    let query = text || (selection ? selection.toString().trim() : currentSelectedText);

    // Fallback: If no highlighted text, attempt to auto-read text from currently selected multi-select messages on Zalo Web
    if (!query && window.ZaloQuickActionAdapter) {
      query = window.ZaloQuickActionAdapter.getSelectedMessagesText();
    }

    if (!query) {
      window.ZaloQuickActionUI.showToast('⚠️ Vui lòng bôi đen văn bản để xác định Quận/Huyện (Alt+A)');
      return;
    }

    if (!window.ZaloAdminLookup) {
      window.ZaloQuickActionUI.showToast('⚠️ Bộ tra cứu địa chính chưa sẵn sàng. Thử lại sau 1s.');
      return;
    }

    await window.ZaloAdminLookup.ensureData();
    const district = window.ZaloAdminLookup.lookupDistrict(query);

    if (district) {
      await setVariableA(district);
      window.ZaloQuickActionUI.showToast(`📌 Biến A: "${district}" (Đã lưu từ "${query}")`);
    } else {
      window.ZaloQuickActionUI.showToast(`⚠️ Không xác định được Quận/Huyện từ: "${query}"`);
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
    const cleaned = window.ZaloQuickActionText.clean(text);
    if (!cleaned) return;

    try {
      await navigator.clipboard.writeText(cleaned);
      window.ZaloQuickActionUI.showToast('📋 Đã sao chép & chuẩn hóa văn bản!');
    } catch (e) {
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
  });

  // 7. Chrome Runtime Message Listener
  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      const text = msg.selectedText || (window.getSelection() ? window.getSelection().toString().trim() : currentSelectedText);

      if (msg.action === 'TRIGGER_HOTKEY_DISTRICT_A') {
        executeDistrictLookupA(text);
        if (sendResponse) sendResponse({ status: 'OK' });
      } else if (msg.action === 'EXECUTE_QUICK_SHARE' || msg.action === 'TRIGGER_HOTKEY_SHARE') {
        executeSmartZaloShare(text);
        if (sendResponse) sendResponse({ status: 'OK' });
      } else if (msg.action === 'EXECUTE_CLEAN_COPY') {
        executeCleanCopy(text);
        if (sendResponse) sendResponse({ status: 'OK' });
      }
    });
  }

  console.log('[Zalo Quick Action] ✅ Content Main Orchestrator initialized successfully.');
})();
