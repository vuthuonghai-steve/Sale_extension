// Background Service Worker for Zalo Quick Action Extension
importScripts('../config/app.js');

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Zalo Quick Action] 🚀 Extension installed successfully.');

  // Initialize Default Settings in Chrome Storage
  const storageKeys = [
    ZaloQuickActionApp.STORAGE_KEYS.ENABLE_FLOATING_TOOLBAR,
    ZaloQuickActionApp.STORAGE_KEYS.AUTO_COPY_ON_SHARE,
    ZaloQuickActionApp.STORAGE_KEYS.TOAST_ENABLED
  ];

  chrome.storage.local.get(storageKeys, (res) => {
    const defaults = {};
    for (const key of storageKeys) {
      if (res[key] === undefined) {
        defaults[key] = ZaloQuickActionApp.DEFAULTS[key];
      }
    }

    if (Object.keys(defaults).length > 0) {
      chrome.storage.local.set(defaults);
    }
  });

  // Create Context Menus
  chrome.contextMenus.create({
    id: ZaloQuickActionApp.SHORTCUTS.QUICK_SHARE.id,
    title: `🚀 Chuyển tiếp nhanh qua Zalo Web (${ZaloQuickActionApp.SHORTCUTS.QUICK_SHARE.description})`,
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'zalo-clean-copy',
    title: '📋 Sao chép & Chuẩn hóa văn bản',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: ZaloQuickActionApp.SHORTCUTS.DISTRICT_LOOKUP_A.id,
    title: `📌 Xác định Quận/Huyện bôi đen (${ZaloQuickActionApp.SHORTCUTS.DISTRICT_LOOKUP_A.description})`,
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

  if (info.menuItemId === ZaloQuickActionApp.SHORTCUTS.QUICK_SHARE.id) {
    safeSendMessage(tab.id, {
      action: ZaloQuickActionApp.ACTIONS.EXECUTE_QUICK_SHARE,
      selectedText: info.selectionText
    });
  } else if (info.menuItemId === 'zalo-clean-copy') {
    safeSendMessage(tab.id, {
      action: ZaloQuickActionApp.ACTIONS.EXECUTE_CLEAN_COPY,
      selectedText: info.selectionText
    });
  } else if (info.menuItemId === ZaloQuickActionApp.SHORTCUTS.DISTRICT_LOOKUP_A.id) {
    safeSendMessage(tab.id, {
      action: ZaloQuickActionApp.ACTIONS.TRIGGER_HOTKEY_DISTRICT_A,
      selectedText: info.selectionText
    });
  }
});

// Handle Commands (Keyboard Hotkeys e.g., Alt+S, Alt+A)
chrome.commands.onCommand.addListener((command) => {
  if (command === ZaloQuickActionApp.SHORTCUTS.QUICK_SHARE.id) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].id) {
        safeSendMessage(tabs[0].id, {
          action: ZaloQuickActionApp.ACTIONS.TRIGGER_HOTKEY_SHARE
        });
      }
    });
  } else if (command === ZaloQuickActionApp.SHORTCUTS.DISTRICT_LOOKUP_A.id) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].id) {
        safeSendMessage(tabs[0].id, {
          action: ZaloQuickActionApp.ACTIONS.TRIGGER_HOTKEY_DISTRICT_A
        });
      }
    });
  }
});

