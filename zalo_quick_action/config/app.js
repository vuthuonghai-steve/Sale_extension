// Centralized Configuration, Shortcuts & Constants for Zalo Quick Action Extension
(function () {
  'use strict';

  const AppConfig = {
    // 1. Phím tắt (Shortcuts & Hotkeys Configuration)
    SHORTCUTS: {
      QUICK_SHARE: {
        id: 'quick-share-zalo',
        key: 's',
        altKey: true,
        description: 'Chuyển tiếp nhanh văn bản bôi đen (Alt+S)'
      },
      DISTRICT_LOOKUP_A: {
        id: 'district-lookup-a',
        key: 'a',
        altKey: true,
        description: 'Xác định Quận Huyện bôi đen và lưu biến A (Alt+A)'
      },
      CANCEL_UI: {
        key: 'Escape',
        description: 'Đóng Floating Toolbar / Modal'
      }
    },

    // 2. Tên các Message Actions trao đổi giữa Background & Content Script
    ACTIONS: {
      TRIGGER_HOTKEY_SHARE: 'TRIGGER_HOTKEY_SHARE',
      TRIGGER_HOTKEY_DISTRICT_A: 'TRIGGER_HOTKEY_DISTRICT_A',
      EXECUTE_QUICK_SHARE: 'EXECUTE_QUICK_SHARE',
      EXECUTE_CLEAN_COPY: 'EXECUTE_CLEAN_COPY'
    },

    // 3. Hằng số Storage Keys & Cài đặt mặc định
    STORAGE_KEYS: {
      ENABLE_FLOATING_TOOLBAR: 'enableFloatingToolbar',
      AUTO_COPY_ON_SHARE: 'autoCopyOnShare',
      TOAST_ENABLED: 'toastEnabled'
    },

    DEFAULTS: {
      enableFloatingToolbar: true,
      autoCopyOnShare: true,
      toastEnabled: true
    },

    // 4. Quy tắc lọc văn bản chọn lọc (Hoa hồng, Thương hiệu)
    FILTER_RULES: {
      COMMISSION_REGEX: /(?:(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?|(?:\/-[a-zA-Z0-9_]+|[🌷🌸🌺🌻🌹💐]))[ \t]*(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?[ \t]*)?(?:\d{1,3}[ \t]*%|\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*)|\d{1,3}[ \t]*%)[ \t]*(?:[-–—]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—]+(?:[ \t]*[-–—][ \t]*[\d\/\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?[ \t]*(?:\([ \t]*(?:[cC]hủ[ \t]*dẫn|[cC][dD])?:?[ \t]*(?:\d{1,3}[ \t]*%|\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*)[ \t]*(?:[-–—]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—]+(?:[ \t]*[-–—][ \t]*[\d\/\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?[ \t]*\)|(?:[-–—][ \t]*)?(?:[cC]hủ[ \t]*dẫn|[cC][dD]):?[ \t]*(?:\d{1,3}[ \t]*%|\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*)[ \t]*(?:[-–—]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—]+(?:[ \t]*[-–—][ \t]*[\d\/\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)?[ \t]*(?:[\.\-–—][ \t]*)?(?=[ \t]*[-([{:–— \t]*(?:Mã|MÃ|mã):?|[ \t]*\n|$)/gui,
      BRAND_REGEX: /(?:[•\-–—][ \t]*)?(?:Nguồn[ \t]+hàng[ \t]+cập[ \t]+nhật[ \t]+liên[ \t]+tục[ \t]+tại[ \t]*)?[🏆🎖️🥇⭐]*[ \t]*TL[ \t]*\d*[ \t]*House[ \t]*[🏆🎖️🥇⭐]*/gui
    },

    // 4. Helper kiểm tra sự kiện phím khớp với cấu hình shortcut
    isShortcut(event, shortcutConfig) {
      if (!event || !shortcutConfig) return false;

      if (shortcutConfig.key === 'Escape') {
        return event.key === 'Escape';
      }

      const keyMatch = event.key?.toLowerCase() === shortcutConfig.key.toLowerCase() || 
                       event.code === `Key${shortcutConfig.key.toUpperCase()}`;
      const altMatch = shortcutConfig.altKey ? event.altKey : !event.altKey;
      const ctrlMatch = shortcutConfig.ctrlKey ? event.ctrlKey : !event.ctrlKey;
      const shiftMatch = shortcutConfig.shiftKey ? event.shiftKey : !event.shiftKey;

      return keyMatch && altMatch && ctrlMatch && shiftMatch;
    }
  };

  // Export to Global Scope (Window in Content Script, globalThis in Background Service Worker)
  if (typeof window !== 'undefined') {
    window.ZaloQuickActionApp = AppConfig;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.ZaloQuickActionApp = AppConfig;
  }
})();
