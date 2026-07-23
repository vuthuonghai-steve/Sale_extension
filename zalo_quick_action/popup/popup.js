// Popup logic for Zalo Quick Action
document.addEventListener('DOMContentLoaded', () => {
  const enableFloatingToolbarEl = document.getElementById('enableFloatingToolbar');
  const autoCopyOnShareEl = document.getElementById('autoCopyOnShare');
  const toastEnabledEl = document.getElementById('toastEnabled');

  // Load Saved Preferences
  chrome.storage.local.get(['enableFloatingToolbar', 'autoCopyOnShare', 'toastEnabled'], (res) => {
    if (res.enableFloatingToolbar !== undefined) enableFloatingToolbarEl.checked = res.enableFloatingToolbar;
    if (res.autoCopyOnShare !== undefined) autoCopyOnShareEl.checked = res.autoCopyOnShare;
    if (res.toastEnabled !== undefined) toastEnabledEl.checked = res.toastEnabled;
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
});
