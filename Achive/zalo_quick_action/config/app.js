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

    // 4. Quy tắc lọc văn bản chọn lọc (Tham chiếu tới config/filter-rules.js)
    get FILTER_RULES() {
      const Rules = (typeof window !== 'undefined' ? window.ZaloQuickActionFilterRules : null) ||
                    (typeof globalThis !== 'undefined' ? globalThis.ZaloQuickActionFilterRules : null);
      if (Rules) return Rules;
      
      // Fallback nếu filter-rules.js chưa nạp
      const EMOJI_PREFIX = `(?:\\/-[a-zA-Z0-9_]+|🌷|🌸|🌺|🌻|🌹|💐|🍾)`;
      const HEADER_PREFIX = `(?:(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?|(?:\\/-[a-zA-Z0-9_]+|🌷|🌸|🌺|🌻|🌹|💐|🍾))[ \t]*(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?[ \t]*)?)`;
      const DURATION = `(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)`;
      const NOTE_BRACKET = `(?:\\([ \t]*[^\n)]*\\)|(?:[-–—_][ \t]*)?(?:[cC]hủ[ \t]*dẫn|[cC]tv[ \t]*dẫn|[cC][tT][vV]|[cC][dD]|[cC]hốt|[cC]hốt[ \t]*ở|[fF]ix|[fF]ix[ \t]*giá|[kK]hách[ \t]*dẫn):?[ \t]*(?:\\d{1,3}[ \t]*%|\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*)[ \t]*(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)?`;
      const PERCENT_SINGLE = `(?:\\d{1,3}[ \t]*%[ \t]*(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)`;
      const PERCENT_MULTI = `(?:${PERCENT_SINGLE}(?:[ \t]*(?:[|/,\\-–—_])[ \t]*${PERCENT_SINGLE})*)`;
      const MONEY_SINGLE = `(?:\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*[ \t]*[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM]))`;
      const NOTE_STANDALONE = `(?:\\([ \t]*.*?(?:[cC]hủ[ \t]*dẫn|[cC]tv[ \t]*dẫn|[cC][tT][vV]|[cC][dD]|[cC]hốt|[hH][hH]|[hH]oa[ \t]*hồng|[fF]ix[ \t]*giá|[fF]ix|[kK]hách[ \t]*dẫn).*?\\)|(?:[-–—_][ \t]*)?(?:[cC]hủ[ \t]*dẫn|[cC]tv[ \t]*dẫn|[cC][tT][vV]|[cC][dD]|[cC]hốt|[cC]hốt[ \t]*ở|[kK]hách[ \t]*dẫn):?[ \t]*(?:\\d{1,3}[ \t]*%|\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*|.*?))`;
      const COMM_CHAIN = `(?:(?:(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?|(?:\\/-[a-zA-Z0-9_]+|🌷|🌸|🌺|🌻|🌹|💐|🍾))[ \t]*(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?[ \t]*)?)?(?:(?:\\d{1,3}[ \t]*%[ \t]*(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)|(?:\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*[ \t]*[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])))[ \t]*(?:\\([ \t]*[^\n)]*\\)|(?:[-–—_][ \t]*)?(?:[cC]hủ[ \t]*dẫn|[cC]tv[ \t]*dẫn|[cC][tT][vV]|[cC][dD]|[cC]hốt|[cC]hốt[ \t]*ở|[fF]ix|[fF]ix[ \t]*giá|[kK]hách[ \t]*dẫn):?[ \t]*(?:\\d{1,3}[ \t]*%|\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*)[ \t]*(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)?)(?:(?:[ \t]*(?:[|/,\\-–—_])[ \t]*|[ \t]+)(?:(?:(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?|(?:\\/-[a-zA-Z0-9_]+|🌷|🌸|🌺|🌻|🌹|💐|🍾))[ \t]*(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?[ \t]*)?)?(?:(?:\\d{1,3}[ \t]*%[ \t]*(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)|(?:\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*[ \t]*[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])))[ \t]*(?:\\([ \t]*[^\n)]*\\)|(?:[-–—_][ \t]*)?(?:[cC]hủ[ \t]*dẫn|[cC]tv[ \t]*dẫn|[cC][tT][vV]|[cC][dD]|[cC]hốt|[cC]hốt[ \t]*ở|[fF]ix|[fF]ix[ \t]*giá|[kK]hách[ \t]*dẫn):?[ \t]*(?:\\d{1,3}[ \t]*%|\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*)[ \t]*(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)?))*`;

      return {
        COMMISSION_REGEX: new RegExp(
          `(?:(?<=\\n|^)[ \\t]*)?${COMM_CHAIN}[ \\t]*(?:[\\.\\-–—_][ \\t]*)?(?=[ \\t]*[-([{:–—_ \\t]*(?:(?:Mã|MÃ|mã):?|[🏆🎖️🥇⭐📍🏢☘⌛]|TL\\d*)|[ \\t]*(?:\\n|$))`,
          'gui'
        ),
        BRAND_REGEX: /(?:[•\-–—][ \t]*)?[🏆🎖️🥇⭐]*[ \t]*(?:Nguồn[ \t]+hàng[ \t]+cập[ \t]+nhật[ \t]+liên[ \t]+tục[ \t]+tại[ \t]*)?[🏆🎖️🥇⭐]*[ \t]*TL[ \t]*\d*[ \t]*House[ \t]*[🏆🎖️🥇⭐]*/gui,
        ORPHAN_EMOJI_REGEX: /^[ \t]*(?:\/-[a-zA-Z0-9_]+|🌷|🌸|🌺|🌻|🌹|💐|🍾)[ \t]*(?=(?:(?:Mã|MÃ|mã):?|[🏆🎖️🥇⭐📍🏢☘⌛]|TL\d*))/gui,
        REPLY_QUOTE_REGEX: /^[ \t]*[a-zA-ZÀ-ỹ0-9_ ][a-zA-ZÀ-ỹ0-9_ ]{1,34}[ \t]*\n(?:[ \t]*[^\n]*?(?:[hH][hH]|[hH]oa[ \t]*hồng|Mã|MÃ|mã|[-•\u1F300-\u1F9FF🌷🌸🌺🌻🌹💐🏢⌛☘🏆⭐📍])[^\n]*\n){1,3}(?=[ \t]*(?:(?:[hH][hH]|[hH]oa[ \t]*hồng|Mã|MÃ|mã|[-•\u1F300-\u1F9FF🌷🌸🌺🌻🌹💐🏢⌛☘🏆⭐📍]|\d|[a-zA-Z])))/gui,
        COMMISSION_LINE_PERCENT_REGEX: new RegExp(
          `^[ \\t]*(?:(?:${HEADER_PREFIX}[ \\t]*)?${COMM_CHAIN}|(?:${HEADER_PREFIX}[ \\t]*)?${NOTE_STANDALONE})[ \\t]*$`,
          'iu'
        ),
        COMMISSION_LINE_MONEY_REGEX: new RegExp(
          `^[ \\t]*(?:${EMOJI_PREFIX}[ \\t]*|(?:HH|Hoa[ \\t]*hồng|Chủ[ \\t]*dẫn|CD|CTV|Ctv):?[ \\t]*)+[ \\t]*\\d+(?:[\\.,]\\d+)?[ \\t]*(?:tr|triệu|k)[ \\t]*\\d*[ \\t]*${DURATION}[ \\t]*${NOTE_BRACKET}[ \\t]*$`,
          'iu'
        )
      };
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
