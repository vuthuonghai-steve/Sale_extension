/**
 * @file src/Configs/AppConfig.js
 * Trung tâm Schema Registry và cấu hình toàn hệ thống Google Apps Script
 */

const CONFIG = {
  // ID Google Spreadsheet mặc định
  DEFAULT_SPREADSHEET_ID: "1-A9ex-6QwdYDAMUYzUTxsNoJ81q18KYV",

  // Thời gian lưu cache tài nguyên Drive (giây) (~25 phút)
  CACHE_TTL_SECONDS: 1500,

  /**
   * Danh mục tất cả các Schemas đã đăng ký trong hệ thống
   * Mỗi entry tương ứng với một Spreadsheet ID
   */
  SCHEMAS_REGISTRY: {
    "1-A9ex-6QwdYDAMUYzUTxsNoJ81q18KYV": typeof DucAnhSchema !== 'undefined' ? DucAnhSchema : null
  },

  /**
   * Lấy Schema tương ứng với Spreadsheet ID (Tự động fallback về GenericFallbackSchema nếu chưa đăng ký)
   * @param {string} [spreadsheetId] 
   * @returns {Object}
   */
  getSchema: function(spreadsheetId) {
    const targetId = spreadsheetId || this.DEFAULT_SPREADSHEET_ID;
    
    // Đảm bảo nạp từ Registry nếu có
    if (this.SCHEMAS_REGISTRY && this.SCHEMAS_REGISTRY[targetId]) {
      return this.SCHEMAS_REGISTRY[targetId];
    }
    if (typeof DucAnhSchema !== 'undefined' && DucAnhSchema.spreadsheetId === targetId) {
      return DucAnhSchema;
    }

    // Fallback thông minh
    return typeof GenericFallbackSchema !== 'undefined' ? GenericFallbackSchema : {
      spreadsheetId: targetId,
      name: "Default Auto Schema",
      options: { headerScanLimit: 10, hasMergedBuildings: true, smartRoomInference: true, priceUnit: "vnd" },
      defaultTabConfig: { fields: {} },
      tabs: {}
    };
  },

  /**
   * Đăng ký thêm một Schema mới vào Registry lúc runtime
   * @param {Object} schema 
   */
  registerSchema: function(schema) {
    if (!schema || !schema.spreadsheetId) return;
    this.SCHEMAS_REGISTRY[schema.spreadsheetId] = schema;
  },

  /**
   * Trích xuất cấu hình trường và options cho một Tab cụ thể trong Spreadsheet
   * @param {Object} schema 
   * @param {string} tabName 
   * @returns {{ fields: Object, options: Object }}
   */
  resolveTabConfig: function(schema, tabName) {
    const defaultFields = (schema && schema.defaultTabConfig && schema.defaultTabConfig.fields) ? schema.defaultTabConfig.fields : {};
    const defaultOptions = (schema && schema.options) ? schema.options : {
      headerScanLimit: 10,
      hasMergedBuildings: true,
      smartRoomInference: true,
      priceUnit: "vnd"
    };

    if (schema && schema.tabs && schema.tabs[tabName]) {
      const tabSpecific = schema.tabs[tabName];
      return {
        fields: Object.assign({}, defaultFields, tabSpecific.fields || {}),
        options: Object.assign({}, defaultOptions, tabSpecific.options || {})
      };
    }

    return {
      fields: defaultFields,
      options: defaultOptions
    };
  }
};
