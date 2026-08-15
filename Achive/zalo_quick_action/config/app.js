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
      const KEYWORD_PREFIX = `(?:[hH][hH]|[hH]oa[ \t]*hồng|[hH]ạn[ \t]*(?:[hH][hH]|[hH]oa[ \t]*hồng)?)`;
      const HEADER_PREFIX = `(?:(?:(?:[hH][hH]|[hH]oa[ \t]*hồng|[hH]ạn[ \t]*(?:[hH][hH]|[hH]oa[ \t]*hồng)?):?|(?:\\/-[a-zA-Z0-9_]+|🌷|🌸|🌺|🌻|🌹|💐|🍾))[ \t]*(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?[ \t]*)?)`;
      const DURATION = `(?:[-–—_]?[ \t]*(?:hd|HĐ|hđ|Hđ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den|trước|truoc|áp[ \t]*dụng[ \t]*(?:đến|tới)?)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]+|[tT][hH][gG]?|[tT][hH]á[nN][gG]|[tT][hH]ang|[tT]+|[nN]ă[mM]|[nN]am)?)`;
      const DEADLINE_ONLY = `(?:(?:áp[ \t]*dụng[ \t]*)?(?:tới|toi|đến|den|trước|truoc|hạn|hết)?[ \t]*(?:ngày[ \t]*)?[\\d\\/\\.\\-–—_]+(?:[ \t]*(?:tháng[ \t]*\\d+|[mM]+|[tT][hH][gG]?|[tT][hH]á[nN][gG]|[tT][hH]ang|[tT]+|[nN]ă[mM]|[nN]am))?)`;
      const MONTHS_SINGLE = `(?:\\d+(?:[\\.,]\\d+)?[ \t]*(?:[tT][hH]á[nN][gG]|[tT][hH]ang|[tT][hH][gG]?|[mM]+|[nN]ă[mM]|[nN]am|[tT]+))`;
      const NOTE_BRACKET = `(?:[ \t]*(?:\\([ \t]*[^\\n)]*\\)?|(?:\\[[ \t]*[^\\n\\]]*\\]?)|(?:[+&,; \t–—_/-]*)(?:[cC]hủ[ \t]*dẫn|[cC]tv[ \t]*dẫn|[cC][tT][vV]|[cC][dD]|[cC]hốt|[cC]hốt[ \t]*ở|[fF]ix|[fF]ix[ \t]*giá|[kK]hách[ \t]*dẫn|[sS]ale|[sS]ale[ \t]*dẫn|[tT]hưởng[ \t]*(?:[nN]óng[ \t]*)?(?:[sS]ale|[cC]tv)?|[bB]onus[ \t]*(?:[sS]ale|[cC]tv)?):?[ \t]*(?:\\d{1,3}[ \t]*%|\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*)?[ \t]*(?:[-–—_]?[ \t]*(?:hd|HĐ|hđ|Hđ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]+|[tT][hH][gG]?|[tT][hH]á[nN][gG]|[tT][hH]ang|[tT]+|[nN]ă[mM]|[nN]am)?)?[ \t]*\\)?)*)`;
      const PERCENT_SINGLE = `(?:\\d{1,3}[ \t]*%[ \t]*(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den|trước|truoc|áp[ \t]*dụng[ \t]*(?:đến|tới)?)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]+|[tT][hH][gG]?|[tT][hH]á[nN][gG]|[tT][hH]ang|[tT]+|[nN]ă[mM]|[nN]am)?)?)`;
      const MONEY_SINGLE = `(?:\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*[ \t]*[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den|trước|truoc)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]+|[tT][hH][gG]?|[tT][hH]á[nN][gG]|[tT][hH]ang|[tT]+|[nN]ă[mM]|[nN]am))`;
      const NOTE_STANDALONE = `(?:\\([ \t]*.*?(?:[cC]hủ[ \t]*dẫn|[cC]tv[ \t]*dẫn|[cC][tT][vV]|[cC][dD]|[cC]hốt|[hH][hH]|[hH]oa[ \t]*hồng|[fF]ix[ \t]*giá|[fF]ix|[kK]hách[ \t]*dẫn|[tT]hưởng|[bB]onus|[hH]ỗ[ \t]*trợ|[tT]ặng).*?\\)|(?:[-–—_][ \t]*)?(?:[cC]hủ[ \t]*dẫn|[cC]tv[ \t]*dẫn|[cC][tT][vV]|[cC][dD]|[cC]hốt|[cC]hốt[ \t]*ở|[kK]hách[ \t]*dẫn|[tT]hưởng[ \t]*(?:[nN]óng[ \t]*)?(?:[sS]ale|[cC]tv)?|[bB]onus[ \t]*(?:[sS]ale|[cC]tv)?):?[ \t]*(?:\\d{1,3}[ \t]*%|\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*|.*?))`;
      
      const COMM_CORE = `(?:(?:${HEADER_PREFIX}[ \t]*(?:${DEADLINE_ONLY}|${MONTHS_SINGLE}))|(?:(?:${HEADER_PREFIX}[ \t]*)?(?:${PERCENT_SINGLE}|${MONEY_SINGLE}))|(?:${HEADER_PREFIX}))`;
      const COMM_SEGMENT = `(?:${COMM_CORE}[ \t]*${NOTE_BRACKET})`;
      const COMM_SEPARATOR = `(?:[ \t]*(?:[|/,\\-–—_])[ \t]*|[ \t]*\\r?\\n[ \t]*|[ \t]+)`;
      const COMM_CHAIN = `(?:${COMM_SEGMENT}(?:${COMM_SEPARATOR}${COMM_SEGMENT})*)`;

      return {
        COMMISSION_REGEX: new RegExp(
          `(?:(?<=\\n|^)[ \\t]*)?${COMM_CHAIN}[ \\t]*(?:[\\.\\-–—_][ \\t]*)?(?=[ \\t]*[-([{:–—_ \\t]*(?:(?:Mã|MÃ|mã):?|[🏆🎖️🥇⭐📍🏢☘⌛]|TL\\d*)|[ \\t]*(?:\\n|$))`,
          'gui'
        ),
        BRAND_REGEX: /(?:[•\-–—][ \t]*)?[🏆🎖️🥇⭐]*[ \t]*(?:Nguồn[ \t]+hàng[ \t]+cập[ \t]+nhật[ \t]+liên[ \t]+tục[ \t]+tại[ \t]*)?[🏆🎖️🥇⭐]*[ \t]*TL[ \t]*\d*[ \t]*House[ \t]*[🏆🎖️🥇⭐]*/gui,
        ORPHAN_EMOJI_REGEX: /^[ \t]*(?:\/-[a-zA-Z0-9_]+|🌷|🌸|🌺|🌻|🌹|💐|🍾)[ \t]*(?=(?:(?:Mã|MÃ|mã):?|[🏆🎖️🥇⭐📍🏢☘⌛]|TL\d*))/gui,
        REPLY_QUOTE_REGEX: /^[ \t]*\[?[ \t]*(?:[tT]rả[ \t]*lời|[rR]eply|[tT]rích[ \t]*dẫn|[qQ]uote)[ \t]*:?[ \t]*[^\n]*\n(?:[ \t]*[^\n]*\n){1,3}(?=[ \t]*(?:(?:[hH][hH]|[hH]oa[ \t]*hồng|Mã|MÃ|mã|[-•\u1F300-\u1F9FF🌷🌸🌺🌻🌹💐🏢⌛☘🏆⭐📍]|\d|[a-zA-Z])))/gui,
        COMMISSION_LINE_PERCENT_REGEX: new RegExp(
          `^[ \\t]*(?:(?:${HEADER_PREFIX}[ \t]*)?${COMM_CHAIN}|(?:${HEADER_PREFIX}[ \t]*)?${NOTE_STANDALONE}|${HEADER_PREFIX}[ \t]*(?:${DEADLINE_ONLY}|${MONTHS_SINGLE})?)[ \\t]*$`,
          'iu'
        ),
        COMMISSION_LINE_MONEY_REGEX: new RegExp(
          `^[ \\t]*(?:${EMOJI_PREFIX}[ \\t]*|(?:HH|Hoa[ \\t]*hồng|Chủ[ \\t]*dẫn|CD|CTV|Ctv):?[ \\t]*)+[ \\t]*\\d+(?:[\\.,]\\d+)?[ \\t]*(?:tr|triệu|k)[ \\t]*\\d*[ \\t]*${DURATION}[ \\t]*${NOTE_BRACKET}[ \\t]*$`,
          'iu'
        ),
        COMMISSION_LINE_BONUS_REGEX: /(?:[tT]hưởng[ \t]*(?:[nN]óng[ \t]*)?(?:[sS]ale|[cC]tv|cho[ \t]*[sS]ale|cho[ \t]*[cC]tv|môi[ \t]*giới)|[bB]onus[ \t]*(?:[sS]ale|[cC]tv)|(?:[hH]ỗ[ \t]*trợ|[tT]ặng)[ \t]+(?:[sS]ale|[cC]tv)|[tT]hưởng[ \t]+[nN]óng|[tT]hưởng[ \t]+\d+(?:[\.,]\d+)?[ \t]*(?:k|tr|triệu|đ|vnd)?[ \t]*(?:\/[ \t]*(?:phòng|căn|p|hđ|hợp[ \t]*đồng))?[ \t]*(?:cho[ \t]*)?(?:sale|ctv|môi[ \t]*giới))/iu
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
