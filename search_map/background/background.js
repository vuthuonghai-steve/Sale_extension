// Extension Background Service Worker (Manifest V3)

// Register Context Menus on Installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'search_gmaps',
    title: 'Tìm "%s" trên Google Maps',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'search_hanoi_admin',
    title: 'Tra cứu hành chính Hà Nội cho "%s" (Alt+M)',
    contexts: ['selection']
  });

  console.log('[Search Map Extension] Service Worker installed & Commands registered.');
});

// Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectionText = info.selectionText ? info.selectionText.trim() : '';
  if (!selectionText) return;

  if (info.menuItemId === 'search_gmaps') {
    const encoded = encodeURIComponent(selectionText);
    chrome.tabs.create({ url: `https://www.google.com/maps/search/${encoded}` });
  } else if (info.menuItemId === 'search_hanoi_admin') {
    if (tab && tab.id) {
      chrome.tabs.sendMessage(
        tab.id,
        { action: 'EXECUTE_ADMIN_LOOKUP', queryText: selectionText },
        () => {
          if (chrome.runtime.lastError) {
            // Silently ignore if tab is not listening or restricted
            console.warn('[Background] Tab not listening:', chrome.runtime.lastError.message);
          }
        }
      );
    }
  }
});

// Listen for Keyboard Shortcuts (e.g. Alt+M)
chrome.commands.onCommand.addListener((command) => {
  if (command === 'search-location') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: 'TRIGGER_SHORTCUT_LOOKUP' },
          () => {
            if (chrome.runtime.lastError) {
              // Silently handle case where current tab cannot receive messages
              console.warn('[Background] Command target tab error:', chrome.runtime.lastError.message);
            }
          }
        );
      }
    });
  }
});

// Helper function to save search term to chrome.storage
function saveToHistory(query) {
  chrome.storage.local.get(['searchHistory'], (result) => {
    let history = result.searchHistory || [];
    history = history.filter((item) => item !== query);
    history.unshift(query);
    if (history.length > 10) history.pop();
    chrome.storage.local.set({ searchHistory: history });
  });
}

// Background Listener for Runtime Messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SAVE_HISTORY') {
    saveToHistory(request.query);
    sendResponse({ status: 'OK' });
  }
  // Do NOT return true unless response is asynchronous
});
