// Content Config Module: Handles Storage & Settings Sync
(function () {
  'use strict';

  window.ZaloQuickActionConfig = {
    settings: {
      enableFloatingToolbar: true,
      autoCopyOnShare: true,
      toastEnabled: true
    },

    init() {
      this.loadSettings();
      this.listenChanges();
    },

    loadSettings() {
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['enableFloatingToolbar', 'autoCopyOnShare', 'toastEnabled'], (res) => {
          if (res.enableFloatingToolbar !== undefined) this.settings.enableFloatingToolbar = res.enableFloatingToolbar;
          if (res.autoCopyOnShare !== undefined) this.settings.autoCopyOnShare = res.autoCopyOnShare;
          if (res.toastEnabled !== undefined) this.settings.toastEnabled = res.toastEnabled;
        });
      }
    },

    listenChanges() {
      if (chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener((changes) => {
          for (let key in changes) {
            if (this.settings.hasOwnProperty(key)) {
              this.settings[key] = changes[key].newValue;
            }
          }
        });
      }
    },

    get(key) {
      return this.settings[key];
    }
  };

  window.ZaloQuickActionConfig.init();
})();
