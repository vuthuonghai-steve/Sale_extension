// Content Text Utility Module: Selective Cleaning & Processing of Selected Text
(function () {
  'use strict';

  window.ZaloQuickActionText = {
    // 1. Chuẩn hóa khoảng trắng và dấu xuống dòng (Giữ nguyên dấu xuống dòng \n đơn)
    normalize(rawText) {
      if (!rawText) return '';
      return rawText
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    },

    // 2. Lọc có chọn lọc: Bỏ hoa hồng, thương hiệu & ký tự đặc thù
    removeSelectiveMetadata(text) {
      if (!text) return '';
      let result = text;

      const Rules = window.ZaloQuickActionFilterRules || App?.FILTER_RULES || {};
      const commissionRegex = Rules.COMMISSION_REGEX || /(?:(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?|(?:\/-[a-zA-Z0-9_]+|[🌷🌸🌺🌻🌹💐]))[ \t]*(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?[ \t]*)?(?:\d{1,3}[ \t]*%|\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*)|\d{1,3}[ \t]*%)[ \t]*(?:[-–—]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—]+(?:[ \t]*[-–—][ \t]*[\d\/\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?[ \t]*(?:\([ \t]*(?:[cC]hủ[ \t]*dẫn|[cC][dD]|[cC]hốt|[cC]hốt[ \t]*ở)?:?[ \t]*(?:\d{1,3}[ \t]*%|\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*|.*?)[ \t]*(?:[-–—]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—]+(?:[ \t]*[-–—][ \t]*[\d\/\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?[ \t]*\)|(?:[-–—][ \t]*)?(?:[cC]hủ[ \t]*dẫn|[cC][dD]|[cC]hốt|[cC]hốt[ \t]*ở):?[ \t]*(?:\d{1,3}[ \t]*%|\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*)[ \t]*(?:[-–—]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—]+(?:[ \t]*[-–—][ \t]*[\d\/\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)?[ \t]*(?:[\.\-–—][ \t]*)?(?=[ \t]*[-([{:–— \t]*(?:Mã|MÃ|mã):?|[ \t]*\n|$)/gui;
      const brandRegex = Rules.BRAND_REGEX || /(?:[•\-–—][ \t]*)?(?:Nguồn[ \t]+hàng[ \t]+cập[ \t]+nhật[ \t]+liên[ \t]+tục[ \t]+tại[ \t]*)?[🏆🎖️🥇⭐]*[ \t]*TL[ \t]*\d*[ \t]*House[ \t]*[🏆🎖️🥇⭐]*/gui;
      const replyQuoteRegex = Rules.REPLY_QUOTE_REGEX || /^[ \t]*[^\n:\/]{2,35}[ \t]*\n(?:[ \t]*[^\n]*?(?:[hH][hH]|[hH]oa[ \t]*hồng|Mã|MÃ|mã|[-•\u1F300-\u1F9FF🌷🌸🌺🌻🌹💐🏢⌛☘🏆⭐📍])[^\n]*\n){1,3}(?=[ \t]*(?:(?:[hH][hH]|[hH]oa[ \t]*hồng|Mã|MÃ|mã|[-•\u1F300-\u1F9FF🌷🌸🌺🌻🌹💐🏢⌛☘🏆⭐📍]|\d|[a-zA-Z])))/gui;

      // Pattern 0: Loại bỏ khung tin nhắn cũ (Reply quote header) nếu văn bản dán/copy bị dính header trích dẫn cũ của Zalo
      result = result.replace(replyQuoteRegex, '');

      // Pattern 1: Loại bỏ thông tin Hoa hồng
      result = result.replace(commissionRegex, '');

      // Pattern 1.5: Loại bỏ emoji tiền tố hoa hồng mồ côi (VD: "🌷 Mã: 🏆 063" -> "Mã: 🏆 063")
      const orphanEmojiRegex = Rules.ORPHAN_EMOJI_REGEX || /^[ \t]*(?:\/-[a-zA-Z0-9_]+|🌷|🌸|🌺|🌻|🌹|💐|🍾)[ \t]*(?=(?:Mã|MÃ|mã):?)/gumi;
      result = result.replace(orphanEmojiRegex, '');

      // Pattern 2: Loại bỏ tên thương hiệu / Team tag
      result = result.replace(brandRegex, '');

      // Pattern 3: Loại bỏ ký tự rác Unicode \uFFFD hoặc BOM \uFEFF
      result = result.replace(/[\uFFFD\uFEFF]/g, '');

      // Pattern 4: Dọn dẹp các dòng rỗng, dòng hoa hồng đứng riêng hoặc dòng dẫn nguồn rỗng
      const commLinePercentRegex = Rules.COMMISSION_LINE_PERCENT_REGEX || /^(?:(?:\/-[a-zA-Z0-9_]+|[🌷🌸🌺🌻🌹💐])[ \t]*)*(?:HH|Hoa[ \t]*hồng)?:?[ \t]*\d{1,3}[ \t]*%[ \t]*(?:[-–—]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—]+(?:[ \t]*[-–—][ \t]*[\d\/\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?[ \t]*(?:\([ \t]*(?:[cC]hủ[ \t]*dẫn|[cC][dD]|[cC]hốt|[cC]hốt[ \t]*ở)?:?[ \t]*(?:\d{1,3}[ \t]*%|\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*|.*?)[ \t]*(?:[-–—]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—]+(?:[ \t]*[-–—][ \t]*[\d\/\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?[ \t]*\)|(?:[-–—][ \t]*)?(?:[cC]hủ[ \t]*dẫn|[cC][dD]|[cC]hốt|[cC]hốt[ \t]*ở):?[ \t]*(?:\d{1,3}[ \t]*%|\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*)[ \t]*(?:[-–—]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—]+(?:[ \t]*[-–—][ \t]*[\d\/\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)?$/iu;
      const commLineMoneyRegex = Rules.COMMISSION_LINE_MONEY_REGEX || /^(?:(?:\/-[a-zA-Z0-9_]+|[🌷🌸🌺🌻🌹💐])[ \t]*|(?:HH|Hoa[ \t]*hồng|Chủ[ \t]*dẫn|CD):?[ \t]*)+[ \t]*\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*[ \t]*(?:[-–—]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—]+(?:[ \t]*[-–—][ \t]*[\d\/\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM]))[ \t]*(?:\([ \t]*(?:[cC]hủ[ \t]*dẫn|[cC][dD])?:?[ \t]*.*?\)|\S+)*$/iu;

      result = result
        .split('\n')
        .map(line => line.trimEnd())
        .filter(line => {
          const trimmed = line.trim();
          if (!trimmed) return true;
          // Bỏ dòng chỉ chứa thông tin hoa hồng phần trăm đứng riêng (VD: "30%-6th", "🌷 40%-12th", "/-rose 35%", "🌷35%-hd 31/8/2027")
          if (commLinePercentRegex.test(trimmed)) return false;
          // Bỏ dòng chỉ chứa hoa hồng số tiền đứng riêng (bắt buộc có tiền tố hoa hồng HH/emoji VÀ thời hạn hợp đồng m/tháng/hd, tránh xóa nhầm dòng Giá như "4tr8-301")
          if (commLineMoneyRegex.test(trimmed)) return false;
          // Bỏ dòng dẫn nguồn rỗng
          if (/^[•\-–—]?[ \t]*Nguồn[ \t]+hàng[ \t]+cập[ \t]+nhật[ \t]+liên[ \t]+tục[ \t]+tại[ \t]*:?$/i.test(trimmed)) return false;
          return true;
        })
        .join('\n');

      const sanitized = this.normalize(result);

      if (window.ZaloQuickActionLogger) {
        window.ZaloQuickActionLogger.info('TextFilter', '🧹 Selective metadata filtered (Commission & Branding removed)', {
          rawInputLength: text.length,
          sanitizedLength: sanitized.length,
          sanitizedPreview: sanitized.substring(0, 120) + (sanitized.length > 120 ? '...' : '')
        });
      }

      return sanitized;
    },

    // 3. Hàm clean chính tích hợp lọc chọn lọc
    clean(rawText, options = { filterBranding: true }) {
      if (!rawText) return '';
      let cleanedText = this.normalize(rawText);

      if (!options || options.filterBranding !== false) {
        cleanedText = this.removeSelectiveMetadata(cleanedText);
      }

      return cleanedText;
    }
  };
})();
