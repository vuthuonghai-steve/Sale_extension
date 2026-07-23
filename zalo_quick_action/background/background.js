// Background Service Worker for Zalo Quick Action Extension
importScripts('hot-reload.js');

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Zalo Quick Action] 🚀 Extension installed successfully.');

  // Initialize Default Settings in Chrome Storage
  chrome.storage.local.get(['enableFloatingToolbar', 'autoCopyOnShare', 'toastEnabled'], (res) => {
    const defaults = {};
    if (res.enableFloatingToolbar === undefined) defaults.enableFloatingToolbar = true;
    if (res.autoCopyOnShare === undefined) defaults.autoCopyOnShare = true;
    if (res.toastEnabled === undefined) defaults.toastEnabled = true;

    if (Object.keys(defaults).length > 0) {
      chrome.storage.local.set(defaults);
    }
  });

  // Create Context Menus
  chrome.contextMenus.create({
    id: 'zalo-quick-share',
    title: '🚀 Chuyển tiếp nhanh qua Zalo Web (Alt+S)',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'zalo-clean-copy',
    title: '📋 Sao chép & Chuẩn hóa văn bản',
    contexts: ['selection']
  });
});

// Helper for safe message sending to active tabs
function safeSendMessage(tabId, message) {
  if (!tabId) return;
  chrome.tabs.sendMessage(tabId, message, (response) => {
    if (chrome.runtime.lastError) {
      console.log('[Background] Message handling note:', chrome.runtime.lastError.message);
    }
  });
}

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) return;

  if (info.menuItemId === 'zalo-quick-share') {
    safeSendMessage(tab.id, {
      action: 'EXECUTE_QUICK_SHARE',
      selectedText: info.selectionText
    });
  } else if (info.menuItemId === 'zalo-clean-copy') {
    safeSendMessage(tab.id, {
      action: 'EXECUTE_CLEAN_COPY',
      selectedText: info.selectionText
    });
  }
});

// Handle Commands (Keyboard Hotkeys e.g., Alt+S)
chrome.commands.onCommand.addListener((command) => {
  if (command === 'quick-share-zalo') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].id) {
        safeSendMessage(tabs[0].id, {
          action: 'TRIGGER_HOTKEY_SHARE'
        });
      }
    });
  }
});
