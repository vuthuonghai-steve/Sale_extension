// Content Script: Main Orchestrator & Event Listener Bridge
(function () {
  'use strict';

  let currentSelectedText = '';

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

  // 2. Clean Copy Action Orchestrator
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

  // 3. Selection Event Listener
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
          onShare: () => executeZaloShare(text),
          onCopy: () => executeCleanCopy(text)
        });
      } else {
        window.ZaloQuickActionUI.hideToolbar();
      }
    }, 50);
  });

  // 4. Keyboard Shortcuts Listener
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.ZaloQuickActionUI.hideToolbar();
    } else if (e.altKey && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
      const selectionText = window.getSelection() ? window.getSelection().toString().trim() : currentSelectedText;
      e.preventDefault();
      executeZaloShare(selectionText);
    }
  });

  // 5. Chrome Runtime Message Listener
  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      const text = msg.selectedText || (window.getSelection() ? window.getSelection().toString().trim() : currentSelectedText);

      if (msg.action === 'EXECUTE_QUICK_SHARE' || msg.action === 'TRIGGER_HOTKEY_SHARE') {
        executeZaloShare(text);
        if (sendResponse) sendResponse({ status: 'OK' });
      } else if (msg.action === 'EXECUTE_CLEAN_COPY') {
        executeCleanCopy(text);
        if (sendResponse) sendResponse({ status: 'OK' });
      }
    });
  }

  console.log('[Zalo Quick Action] ✅ Content Main Orchestrator initialized successfully.');
})();
