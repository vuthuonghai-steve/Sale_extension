/**
 * Pure Regular Expressions & Filter Rules cho Sub-module Lọc Tin nhắn Zalo Web
 * (Architect §4 — Layer 3 Pure TS Constants, 100% Zero-Dependencies).
 */

// =========================================================================
// 🧩 SUB-PATTERNS REGEX BUILDING BLOCKS
// =========================================================================
const P = {
  // Ký tự Emoji/Biểu tượng tiền tố hoa hồng (🌷, 🌸, 🌺, 🌻, 🌹, 💐, 🍾, /-rose...)
  EMOJI_PREFIX: `(?:\\/-[a-zA-Z0-9_]+|🌷|🌸|🌺|🌻|🌹|💐|🍾)`,

  // Tiền tố từ khóa Hoa hồng (HH, Hoa hồng, Hh...)
  KEYWORD_PREFIX: `(?:[hH][hH]|[hH]oa[ \t]*hồng)`,

  // Tổng hợp tiền tố nhận diện Hoa hồng (Emoji hoặc Từ khóa HH)
  HEADER_PREFIX: `(?:(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?|(?:\\/-[a-zA-Z0-9_]+|🌷|🌸|🌺|🌻|🌹|💐|🍾))[ \t]*(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?[ \t]*)?)`,

  // Giá trị hoa hồng: % (VD: 30%, 40%) hoặc Tiền mặt (VD: 1tr1, 2 triệu, 500k)
  VALUE: `(?:\\d{1,3}[ \t]*%|\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*)`,

  // Thời hạn hợp đồng / hạn thuê (VD: 12th, 6-12m, hd 30/7/2027, hạn đến 31/8/2027)
  DURATION: `(?:[-–—]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—]+(?:[ \t]*[-–—][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)`,

  // Chuỗi đa mốc hoa hồng liên tiếp nhau (VD: "40%- 12th | 30%- 6th" hoặc "35%-12th | 25%-6th")
  MULTI_SEGMENT: `(?:\\d{1,3}[ \t]*%|\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*)[ \t]*(?:[-–—]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—]+(?:[ \t]*[-–—][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?(?:[ \t]*(?:[|/,\\-–—])[ \t]*(?:\\d{1,3}[ \t]*%|\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*)[ \t]*(?:[-–—]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—]+(?:[ \t]*[-–—][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)*`,

  // Ghi chú đính kèm trong ngoặc đơn hoặc dấu gạch ngang (VD: "( Chủ dẫn)", "( Chốt ở trước 15/7)", "- CD 30%")
  NOTE_BRACKET: `(?:\\([ \\t]*(?:[cC]hủ[ \\t]*dẫn|[cC][dD]|[cC]hốt|[cC]hốt[ \\t]*ở)?:?[ \\t]*(?:\\d{1,3}[ \\t]*%|\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*|.*?)[ \\t]*(?:[-–—]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—]+(?:[ \t]*[-–—][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?[ \\t]*\\)|(?:[-–—][ \\t]*)?(?:[cC]hủ[ \t]*dẫn|[cC][dD]|[cC]hốt|[cC]hốt[ \\t]*ở):?[ \t]*(?:\\d{1,3}[ \\t]*%|\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*)[ \\t]*(?:[-–—]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—]+(?:[ \t]*[-–—][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)?`,
};

// =========================================================================
// 🚀 FILTER RULES CONSTANTS
// =========================================================================
export const FilterRules = {
  PATTERNS: P,

  /**
   * 1. Regular Expression Lọc Hoa Hồng Dính Trước Mã (Commission Regex)
   * Nhận diện và loại bỏ các mẫu thông tin hoa hồng đứng dính trước Mã nhà/Căn hộ.
   */
  COMMISSION_REGEX: new RegExp(
    `(?:${P.HEADER_PREFIX}[ \\t]*${P.MULTI_SEGMENT}[ \\t]*${P.NOTE_BRACKET}|(?:\\d{1,3}[ \\t]*%)[ \\t]*${P.DURATION}?[ \\t]*${P.NOTE_BRACKET})[ \\t]*(?:[\\.\\-–—][ \\t]*)?(?=[ \\t]*[-([{:–— \\t]*(?:Mã|MÃ|mã):?|[ \\t]*\\n|$)`,
    'gui'
  ),

  /**
   * 2. Regular Expression Lọc Thương Hiệu / Tag Nhóm Hàng (Branding Regex)
   */
  BRAND_REGEX: /(?:[•\-–—][ \t]*)?[🏆🎖️🥇⭐]*[ \t]*(?:Nguồn[ \t]+hàng[ \t]+cập[ \t]+nhật[ \t]+liên[ \t]+tục[ \t]+tại[ \t]*)?[🏆🎖️🥇⭐]*[ \t]*TL[ \t]*\d*[ \t]*House[ \t]*[🏆🎖️🥇⭐]*/gui,

  /**
   * 2.5 Regular Expression Lọc Emoji Hoa Hồng Mồ Côi Đứng Trước Mã (Orphan Emoji Regex)
   */
  ORPHAN_EMOJI_REGEX: /^[ \t]*(?:\/-[a-zA-Z0-9_]+|🌷|🌸|🌺|🌻|🌹|💐|🍾)[ \t]*(?=(?:Mã|MÃ|mã):?)/gumi,

  /**
   * 3. Regular Expression Loại Bỏ Header Reply Quote Cũ (Reply Quote Regex)
   */
  REPLY_QUOTE_REGEX: /^[ \t]*[^\n:\/]{2,35}[ \t]*\n(?:[ \t]*[^\n]*?(?:[hH][hH]|[hH]oa[ \t]*hồng|Mã|MÃ|mã|[-•\u1F300-\u1F9FF🌷🌸🌺🌻🌹💐🏢⌛☘🏆⭐📍])[^\n]*\n){1,3}(?=[ \t]*(?:(?:[hH][hH]|[hH]oa[ \t]*hồng|Mã|MÃ|mã|[-•\u1F300-\u1F9FF🌷🌸🌺🌻🌹💐🏢⌛☘🏆⭐📍]|\d|[a-zA-Z])))/gui,

  /**
   * 4. Regular Expression Lọc Dòng Hoa Hồng Đứng Độc Lập (%)
   */
  COMMISSION_LINE_PERCENT_REGEX: new RegExp(
    `^[ \\t]*(?:${P.HEADER_PREFIX})?[ \\t]*${P.MULTI_SEGMENT}[ \\t]*${P.NOTE_BRACKET}[ \\t]*$`,
    'iu'
  ),

  /**
   * 5. Regular Expression Lọc Dòng Hoa Hồng Số Tiền Đứng Độc Lập (tr/triệu/k)
   */
  COMMISSION_LINE_MONEY_REGEX: new RegExp(
    `^[ \\t]*(?:${P.EMOJI_PREFIX}[ \\t]*|(?:HH|Hoa[ \\t]*hồng|Chủ[ \\t]*dẫn|CD):?[ \\t]*)+[ \\t]*\\d+(?:[\\.,]\\d+)?[ \\t]*(?:tr|triệu|k)[ \t]*\\d*[ \\t]*${P.DURATION}[ \\t]*${P.NOTE_BRACKET}[ \\t]*$`,
    'iu'
  ),
};
