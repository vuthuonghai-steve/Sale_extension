// Popup logic for Zalo Quick Action
document.addEventListener('DOMContentLoaded', () => {
  const enableFloatingToolbarEl = document.getElementById('enableFloatingToolbar');
  const autoCopyOnShareEl = document.getElementById('autoCopyOnShare');
  const toastEnabledEl = document.getElementById('toastEnabled');
  const autoSeparatorEnabledEl = document.getElementById('autoSeparatorEnabled');
  const autoSeparatorTextEl = document.getElementById('autoSeparatorText');
  const autoSeparatorDelayEl = document.getElementById('autoSeparatorDelay');
  const separatorSubfieldsEl = document.getElementById('separatorSubfields');

  const updateSubfieldsVisibility = (enabled) => {
    if (separatorSubfieldsEl) {
      separatorSubfieldsEl.style.opacity = enabled ? '1' : '0.4';
      separatorSubfieldsEl.style.pointerEvents = enabled ? 'auto' : 'none';
    }
  };

  // Load Saved Preferences
  const keysToLoad = [
    'enableFloatingToolbar',
    'autoCopyOnShare',
    'toastEnabled',
    'autoSeparatorEnabled',
    'autoSeparatorText',
    'autoSeparatorDelay'
  ];

  chrome.storage.local.get(keysToLoad, (res) => {
    if (res.enableFloatingToolbar !== undefined) enableFloatingToolbarEl.checked = res.enableFloatingToolbar;
    if (res.autoCopyOnShare !== undefined) autoCopyOnShareEl.checked = res.autoCopyOnShare;
    if (res.toastEnabled !== undefined) toastEnabledEl.checked = res.toastEnabled;
    if (res.autoSeparatorEnabled !== undefined) {
      autoSeparatorEnabledEl.checked = res.autoSeparatorEnabled;
      updateSubfieldsVisibility(res.autoSeparatorEnabled);
    }
    if (res.autoSeparatorText !== undefined && autoSeparatorTextEl) {
      autoSeparatorTextEl.value = res.autoSeparatorText;
    }
    if (res.autoSeparatorDelay !== undefined && autoSeparatorDelayEl) {
      autoSeparatorDelayEl.value = res.autoSeparatorDelay;
    }
  });

  // Save Preferences on Toggle Change
  enableFloatingToolbarEl.addEventListener('change', (e) => {
    chrome.storage.local.set({ enableFloatingToolbar: e.target.checked });
  });

  autoCopyOnShareEl.addEventListener('change', (e) => {
    chrome.storage.local.set({ autoCopyOnShare: e.target.checked });
  });

  toastEnabledEl.addEventListener('change', (e) => {
    chrome.storage.local.set({ toastEnabled: e.target.checked });
  });

  if (autoSeparatorEnabledEl) {
    autoSeparatorEnabledEl.addEventListener('change', (e) => {
      chrome.storage.local.set({ autoSeparatorEnabled: e.target.checked });
      updateSubfieldsVisibility(e.target.checked);
    });
  }

  if (autoSeparatorTextEl) {
    autoSeparatorTextEl.addEventListener('input', (e) => {
      chrome.storage.local.set({ autoSeparatorText: e.target.value });
    });
  }

  if (autoSeparatorDelayEl) {
    autoSeparatorDelayEl.addEventListener('change', (e) => {
      const val = Math.max(1, parseInt(e.target.value, 10) || 3);
      e.target.value = val;
      chrome.storage.local.set({ autoSeparatorDelay: val });
    });
  }
});
