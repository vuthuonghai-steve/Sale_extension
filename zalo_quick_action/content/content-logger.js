// Content Dev Logger Module: Rich UI Alerts & Structured Dev Logging
(function () {
  'use strict';

  const PREFIX = '[Zalo Quick Action]';
  const LOG_LEVELS = {
    INFO: { label: 'INFO', color: '#38bdf8', icon: 'ℹ️' },
    WARN: { label: 'WARN', color: '#fbbf24', icon: '⚠️' },
    ERROR: { label: 'ERROR', color: '#f87171', icon: '❌' },
    SUCCESS: { label: 'SUCCESS', color: '#4ade80', icon: '✅' }
  };

  // Internal log store for Dev Debugging Panel / Inspection
  const logHistory = [];

  window.ZaloQuickActionLogger = {
    // 1. Structured Console Logging with Scope
    log(scope, message, data = null, level = 'INFO') {
      const timestamp = new Date().toLocaleTimeString();
      const meta = LOG_LEVELS[level] || LOG_LEVELS.INFO;
      
      const logEntry = {
        timestamp,
        scope,
        message,
        data,
        level
      };

      logHistory.push(logEntry);
      if (logHistory.length > 100) logHistory.shift(); // Keep last 100 logs

      const scopeTag = `%c${PREFIX} [${scope}]`;
      const scopeStyle = `color: ${meta.color}; font-weight: bold; font-size: 11px;`;
      const timeStyle = 'color: #94a3b8; font-size: 10px;';

      if (data) {
        console.groupCollapsed(`${scopeTag} %c${timestamp} - ${meta.icon} ${message}`, scopeStyle, timeStyle);
        console.log('Details / Context:', data);
        console.trace('Stack Trace:');
        console.groupEnd();
      } else {
        console.log(`${scopeTag} %c${timestamp} - ${meta.icon} ${message}`, scopeStyle, timeStyle);
      }

      // If level is ERROR, trigger Dev Error UI Alert directly
      if (level === 'ERROR') {
        this.notifyDevError(scope, message, data);
      }
    },

    info(scope, message, data) { this.log(scope, message, data, 'INFO'); },
    warn(scope, message, data) { this.log(scope, message, data, 'WARN'); },
    error(scope, message, data) { this.log(scope, message, data, 'ERROR'); },
    success(scope, message, data) { this.log(scope, message, data, 'SUCCESS'); },

    // 2. High-Visibility Dev Error Alert Box (Rendered via UI engine if available)
    notifyDevError(scope, message, data) {
      if (window.ZaloQuickActionUI && typeof window.ZaloQuickActionUI.showDevErrorModal === 'function') {
        window.ZaloQuickActionUI.showDevErrorModal({ scope, message, data });
      }
    },

    getHistory() {
      return [...logHistory];
    }
  };

  console.log(`${PREFIX} [Logger] ✅ Content Logger initialized.`);
})();
