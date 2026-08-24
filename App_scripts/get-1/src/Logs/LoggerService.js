/**
 * @file src/Logs/LoggerService.js
 * Dịch vụ ghi log và thu thập dữ liệu chẩn đoán (Diagnostics) hệ thống
 */

const LoggerService = {
  /**
   * Ghi log thông tin
   * @param {string} message 
   * @param {any} [context] 
   */
  info: function(message, context) {
    const logStr = context ? `[INFO] ${message} | ${JSON.stringify(context)}` : `[INFO] ${message}`;
    Logger.log(logStr);
  },

  /**
   * Ghi log cảnh báo
   * @param {string} message 
   * @param {any} [context] 
   */
  warn: function(message, context) {
    const logStr = context ? `[WARN] ${message} | ${JSON.stringify(context)}` : `[WARN] ${message}`;
    Logger.log(logStr);
  },

  /**
   * Ghi log lỗi
   * @param {string} message 
   * @param {Error|any} [error] 
   */
  error: function(message, error) {
    const errDetail = error instanceof Error ? `${error.message}\n${error.stack}` : JSON.stringify(error || "");
    Logger.log(`[ERROR] ${message} | ${errDetail}`);
  }
};
