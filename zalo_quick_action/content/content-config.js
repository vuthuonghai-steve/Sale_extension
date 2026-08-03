// Content Config Module: Handles Storage & Settings Sync
(function () {
  'use strict';

  const App = window.ZaloQuickActionApp;

  window.ZaloQuickActionConfig = {
    settings: App ? { ...App.DEFAULTS } : {
      enableFloatingToolbar: true,
      autoCopyOnShare: true,
      toastEnabled: true
    },

    init() {
      this.loadSettings();
      this.listenChanges();
    },

    loadSettings() {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime?.id && chrome.storage && chrome.storage.local) {
          const keys = App ? Object.values(App.STORAGE_KEYS) : ['enableFloatingToolbar', 'autoCopyOnShare', 'toastEnabled'];
          chrome.storage.local.get(keys, (res) => {
            if (chrome.runtime?.lastError) return;
            for (let key of keys) {
              if (res && res[key] !== undefined) {
                this.settings[key] = res[key];
              }
            }
          });
        }
      } catch (e) {
        // Use default in-memory settings if context invalidated
      }
    },

    listenChanges() {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime?.id && chrome.storage && chrome.storage.onChanged) {
          chrome.storage.onChanged.addListener((changes) => {
            for (let key in changes) {
              if (this.settings.hasOwnProperty(key)) {
                this.settings[key] = changes[key].newValue;
              }
            }
          });
        }
      } catch (e) {
        // Ignore context invalidation
      }
    },

    get(key) {
      return this.settings[key];
    }
  };

  window.ZaloQuickActionConfig.init();
})();

