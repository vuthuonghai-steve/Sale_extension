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

      const App = window.ZaloQuickActionApp;
      const commissionRegex = App?.FILTER_RULES?.COMMISSION_REGEX || /(?:HH|Hoa[ \t]*hồng)?:?[ \t]*(?:[\u{1F300}-\u{1F9FF}]|[🌷🌸🌺🌻🌹💐])?[ \t]*\d{1,3}[ \t]*%[ \t]*(?:(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng)?[ \t]*[\d\/\.\-–—TtmM\s]*?)?(?=[ \t]*Mã:|[ \t]*MÃ:|[ \t]*mã:|\n|$)/gui;
      const brandRegex = App?.FILTER_RULES?.BRAND_REGEX || /(?:[•\-–—][ \t]*)?(?:Nguồn[ \t]+hàng[ \t]+cập[ \t]+nhật[ \t]+liên[ \t]+tục[ \t]+tại[ \t]*)?[🏆🎖️🥇⭐]*[ \t]*TL[ \t]*\d*[ \t]*House[ \t]*[🏆🎖️🥇⭐]*/gui;

      // Pattern 1: Loại bỏ thông tin Hoa hồng (VD: "🌷40% - 6-12m", "🌷30% hd 30/7/2027", "40% - 6-12m")
      result = result.replace(commissionRegex, '');

      // Pattern 2: Loại bỏ tên thương hiệu / Team tag (VD: "🏆TL21House🏆", "• Nguồn hàng cập nhật liên tục tại 🏆TL21House🏆")
      result = result.replace(brandRegex, '');

      // Pattern 3: Loại bỏ ký tự rác Unicode \uFFFD hoặc BOM \uFEFF (TUYỆT ĐỐI KHÔNG xóa surrogate pairs để bảo vệ tất cả emoji 🍾🏢📍🏆🚗)
      result = result.replace(/[\uFFFD\uFEFF]/g, '');

      // Pattern 4: Dọn dẹp các dòng rỗng, dòng hoa hồng đứng riêng (VD: "30%-6th", "40%-12th") hoặc dòng dẫn nguồn rỗng
      result = result
        .split('\n')
        .map(line => line.trimEnd())
        .filter(line => {
          const trimmed = line.trim();
          if (!trimmed) return true;
          // Bỏ dòng chỉ chứa thông tin hoa hồng đứng riêng biệt (VD: "30%-6th", "🌷 40%-12th")
          if (/^[🌷🌸🌺🌻🌹💐]?\s*(?:HH|Hoa\s*hồng)?:?\s*\d{1,3}\s*%\s*[-–—]?\s*\d*(?:-\d+)?\s*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG])?$/i.test(trimmed)) return false;
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
