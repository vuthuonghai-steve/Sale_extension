// Content Text Utility Module: Cleaning & Processing Selected Text
(function () {
  'use strict';

  window.ZaloQuickActionText = {
    clean(rawText) {
      if (!rawText) return '';
      return rawText
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();
    }
  };
})();
