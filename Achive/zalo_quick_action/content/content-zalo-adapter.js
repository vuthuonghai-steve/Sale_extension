// Content Zalo Web Automation Adapter Module: Facade Pattern aggregating Zalo DOM, Extractor & Share sub-modules
(function () {
  'use strict';

  window.ZaloQuickActionAdapter = {
    isZaloWeb() {
      return window.ZaloQuickActionDOM?.isZaloWeb() ?? window.location.hostname.includes('zalo.me');
    },

    simulateClick(element) {
      return window.ZaloQuickActionDOM?.simulateClick(element);
    },

    tryRecheckMessageFromNode(node) {
      return window.ZaloQuickActionDOM?.tryRecheckMessageFromNode(node) ?? false;
    },

    getSelectedMessagesText() {
      return window.ZaloQuickActionExtractor?.getSelectedMessagesText() ?? '';
    },

    getFullMessageFromSelection() {
      return window.ZaloQuickActionExtractor?.getFullMessageFromSelection() ?? '';
    },

    tryTriggerMultiSelectShare() {
      return window.ZaloQuickActionShare?.tryTriggerMultiSelectShare() ?? Promise.resolve(false);
    },

    tryInjectShareModalSearchInput(text) {
      return window.ZaloQuickActionShare?.tryInjectShareModalSearchInput(text) ?? Promise.resolve(false);
    },

    tryInjectSearchInput(text) {
      return window.ZaloQuickActionShare?.tryInjectSearchInput(text) ?? false;
    },

    tryTriggerWebShare(cleanedText) {
      return window.ZaloQuickActionShare?.tryTriggerWebShare(cleanedText) ?? false;
    }
  };
})();
