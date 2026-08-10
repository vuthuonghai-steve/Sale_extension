// Centralized Filter Rules & Regular Expressions for Zalo Quick Action Extension
(function () {
  'use strict';

  // =========================================================================
  // 🧩 SUB-PATTERNS REGEX BUILDING BLOCKS (Biến nhỏ để ghép thành Regex lớn)
  // =========================================================================
  const P = {
    // Ký tự Emoji/Biểu tượng tiền tố hoa hồng (🌷, 🌸, 🌺, 🌻, 🌹, 💐, 🍾, /-rose...)
    EMOJI_PREFIX: `(?:\\/-[a-zA-Z0-9_]+|🌷|🌸|🌺|🌻|🌹|💐|🍾)`,

    // Tiền tố từ khóa Hoa hồng (HH, Hoa hồng, Hh...)
    KEYWORD_PREFIX: `(?:[hH][hH]|[hH]oa[ \t]*hồng)`,

    // Tổng hợp tiền tố nhận diện Hoa hồng (Emoji hoặc Từ khóa HH)
    HEADER_PREFIX: `(?:(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?|(?:\\/-[a-zA-Z0-9_]+|🌷|🌸|🌺|🌻|🌹|💐|🍾))[ \t]*(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?[ \t]*)?)`,

    // Thời hạn hợp đồng / hạn thuê (VD: 12th, _12th, 6-12m, hd 30/7/2027, hạn đến 31/8/2027)
    DURATION: `(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)`,

    // Ghi chú đính kèm trong ngoặc đơn hoặc dấu gạch ngang (VD: "( ctv dẫn)", "( Chủ dẫn)", "( Chốt ở trước 15/7)", "(Chốt đúng giá, fix giá hh 30%)", "- CD 30%", "thưởng sale 500k")
    NOTE_BRACKET: `(?:\\([ \t]*[^\n)]*\\)|(?:[+&,; \t–—_/-]*)(?:[cC]hủ[ \t]*dẫn|[cC]tv[ \t]*dẫn|[cC][tT][vV]|[cC][dD]|[cC]hốt|[cC]hốt[ \t]*ở|[fF]ix|[fF]ix[ \t]*giá|[kK]hách[ \t]*dẫn|[tT]hưởng[ \t]*(?:[nN]óng[ \t]*)?(?:[sS]ale|[cC]tv)?|[bB]onus[ \t]*(?:[sS]ale|[cC]tv)?):?[ \t]*(?:\\d{1,3}[ \t]*%|\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*)[ \t]*(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)?`,

    // Mốc hoa hồng phần trăm đơn lẻ (VD: 40%-12m, 40%_12th, 30%-6th, 35%-hd 31/8/2027)
    PERCENT_SINGLE: `(?:\\d{1,3}[ \t]*%[ \t]*(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)`,

    // Chuỗi đa mốc hoa hồng phần trăm liên tiếp nhau nối bằng | hoặc , hoặc - hoặc _ (VD: "40%- 12th | 30%- 6th")
    PERCENT_MULTI: `(?:(?:\\d{1,3}[ \t]*%[ \t]*(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)(?:[ \t]*(?:[|/,\\-–—_])[ \t]*(?:\\d{1,3}[ \t]*%[ \t]*(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?))*)`,

    // Mốc hoa hồng tiền mặt đơn lẻ (bắt buộc có DURATION hoặc số tiền rõ ràng, VD: "1tr1 - 6-12m")
    MONEY_SINGLE: `(?:\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*[ \t]*[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM]))`,

    // Ghi chú hoa hồng đứng độc lập 1 dòng (trong ngoặc hoặc có tiền tố gạch ngang)
    NOTE_STANDALONE: `(?:\\([ \t]*.*?(?:[cC]hủ[ \t]*dẫn|[cC]tv[ \t]*dẫn|[cC][tT][vV]|[cC][dD]|[cC]hốt|[hH][hH]|[hH]oa[ \t]*hồng|[fF]ix[ \t]*giá|[fF]ix|[kK]hách[ \t]*dẫn|[tT]hưởng|[bB]onus|[hH]ỗ[ \t]*trợ|[tT]ặng).*?\\)|(?:[-–—_][ \t]*)?(?:[cC]hủ[ \t]*dẫn|[cC]tv[ \t]*dẫn|[cC][tT][vV]|[cC][dD]|[cC]hốt|[cC]hốt[ \t]*ở|[kK]hách[ \t]*dẫn|[tT]hưởng[ \t]*(?:[nN]óng[ \t]*)?(?:[sS]ale|[cC]tv)?|[bB]onus[ \t]*(?:[sS]ale|[cC]tv)?):?[ \t]*(?:\\d{1,3}[ \t]*%|\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*|.*?))`,

    // Phân đoạn hoa hồng hoàn chỉnh (VD: "🌷40%_12th ( ctv dẫn)" hoặc "30%_12th ( Chủ dẫn)" hoặc "1tr1 - 6-12m")
    COMM_SEGMENT: `(?:(?:(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?|(?:\\/-[a-zA-Z0-9_]+|🌷|🌸|🌺|🌻|🌹|💐|🍾))[ \t]*(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?[ \t]*)?)?(?:(?:\\d{1,3}[ \t]*%[ \t]*(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)|(?:\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*[ \t]*[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])))[ \t]*(?:\\([ \t]*[^\n)]*\\)|(?:[+&,; \t–—_/-]*)(?:[cC]hủ[ \t]*dẫn|[cC]tv[ \t]*dẫn|[cC][tT][vV]|[cC][dD]|[cC]hốt|[cC]hốt[ \t]*ở|[fF]ix|[fF]ix[ \t]*giá|[kK]hách[ \t]*dẫn|[tT]hưởng[ \t]*(?:[nN]óng[ \t]*)?(?:[sS]ale|[cC]tv)?|[bB]onus[ \t]*(?:[sS]ale|[cC]tv)?):?[ \t]*(?:\\d{1,3}[ \t]*%|\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*)[ \t]*(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)?)`,

    // Chuỗi nhiều phân đoạn hoa hồng liên tiếp nối nhau bằng |, /, phẩy, gạch, hoặc khoảng trắng
    COMM_CHAIN: `(?:(?:(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?|(?:\\/-[a-zA-Z0-9_]+|🌷|🌸|🌺|🌻|🌹|💐|🍾))[ \t]*(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?[ \t]*)?)?(?:(?:\\d{1,3}[ \t]*%[ \t]*(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)|(?:\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*[ \t]*[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])))[ \t]*(?:\\([ \t]*[^\n)]*\\)|(?:[+&,; \t–—_/-]*)(?:[cC]hủ[ \t]*dẫn|[cC]tv[ \t]*dẫn|[cC][tT][vV]|[cC][dD]|[cC]hốt|[cC]hốt[ \t]*ở|[fF]ix|[fF]ix[ \t]*giá|[kK]hách[ \t]*dẫn|[tT]hưởng[ \t]*(?:[nN]óng[ \t]*)?(?:[sS]ale|[cC]tv)?|[bB]onus[ \t]*(?:[sS]ale|[cC]tv)?):?[ \t]*(?:\\d{1,3}[ \t]*%|\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*)[ \t]*(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)?)(?:(?:[ \t]*(?:[|/,\\-–—_])[ \t]*|[ \t]+)(?:(?:(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?|(?:\\/-[a-zA-Z0-9_]+|🌷|🌸|🌺|🌻|🌹|💐|🍾))[ \t]*(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?[ \t]*)?)?(?:(?:\\d{1,3}[ \t]*%[ \t]*(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)|(?:\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*[ \t]*[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])))[ \t]*(?:\\([ \t]*[^\n)]*\\)|(?:[+&,; \t–—_/-]*)(?:[cC]hủ[ \t]*dẫn|[cC]tv[ \t]*dẫn|[cC][tT][vV]|[cC][dD]|[cC]hốt|[cC]hốt[ \t]*ở|[fF]ix|[fF]ix[ \t]*giá|[kK]hách[ \t]*dẫn|[tT]hưởng[ \t]*(?:[nN]óng[ \t]*)?(?:[sS]ale|[cC]tv)?|[bB]onus[ \t]*(?:[sS]ale|[cC]tv)?):?[ \t]*(?:\\d{1,3}[ \t]*%|\\d+(?:[\\.,]\\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\\d*)[ \t]*(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\\d\\/\\.\\-–—_]+(?:[ \t]*[-–—_][ \t]*[\\d\\/\\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)?))*`
  };

  // =========================================================================
  // 🚀 HOÀN THIỆN CÁC REGEX CHÍNH BẰNG CÁCH GHÉP TỪ CÁC SUB-PATTERNS
  // =========================================================================
  const FilterRules = {
    // Export Sub-Patterns để dễ tái sử dụng hoặc mở rộng ở các module khác nếu cần
    PATTERNS: P,

    /**
     * 1. Regular Expression Lọc Hoa Hồng Dính Trước Mã (Commission Regex)
     * Nhận diện và loại bỏ các mẫu thông tin hoa hồng đứng dính trước Mã nhà hoặc Cúp [🏆🎖️🥇⭐📍]:
     * - "🌷 40%-12m 🏆 032" -> "🏆 032"
     * - "🌷 40%- 12th | 30%- 6th Mã: 🏆 379" -> "Mã: 🏆 379"
     * - "🌷40% - 6-12m", "🌷30% hd 30/7/2027", "40% - 6-12m", "/-rose 35% Mã 801"
     * - "🌷35%-hd 31/8/2027 Mã: 🏆 119", "🌷40% - hd toi 30/8/2027 Mã: 🏆 982"
     * - "🌷1tr1 - 6-12m Mã: 🏆 626", "🌷40% - 12m ( Chủ dẫn 30% -12M) Mã: 🏆 232"
     * - "🌷40%_12th ( ctv dẫn) \n 30%_12th ( Chủ dẫn) Mã: 🏆" -> "Mã: 🏆"
     * - "🌷40%_12th ( ctv dẫn) 30%_12th ( Chủ dẫn) Mã: 🏆" -> "Mã: 🏆"
     */
    COMMISSION_REGEX: new RegExp(
      `(?:(?<=\\n|^)[ \\t]*)?${P.COMM_CHAIN}[ \\t]*(?:[\\.\\-–—_][ \\t]*)?(?=[ \\t]*[-([{:–—_ \\t]*(?:(?:Mã|MÃ|mã):?|[🏆🎖️🥇⭐📍🏢☘⌛]|TL\\d*)|[ \\t]*(?:\\n|$))`,
      'gui'
    ),

    /**
     * 2. Regular Expression Lọc Thương Hiệu / Tag Nhóm Hàng (Branding Regex)
     * Nhận diện và loại bỏ các tag thương hiệu nguồn hàng, ví dụ:
     * - "🏆TL21House🏆", "• Nguồn hàng cập nhật liên tục tại 🏆TL21House🏆", "🏆 Nguồn hàng cập nhật liên tục tại TL21House"
     */
    BRAND_REGEX: /(?:[•\-–—][ \t]*)?[🏆🎖️🥇⭐]*[ \t]*(?:Nguồn[ \t]+hàng[ \t]+cập[ \t]+nhật[ \t]+liên[ \t]+tục[ \t]+tại[ \t]*)?[🏆🎖️🥇⭐]*[ \t]*TL[ \t]*\d*[ \t]*House[ \t]*[🏆🎖️🥇⭐]*/gui,

    /**
     * 2.5 Regular Expression Lọc Emoji Hoa Hồng Mồ Côi Đứng Trước Mã (Orphan Emoji Regex)
     * Xóa các icon hoa hồng mồ côi bị dư ở đầu dòng khi đứng trực tiếp trước Mã hoặc Cúp:
     * - "🌷 Mã: 🏆 063" -> "Mã: 🏆 063"
     * - "🌷 🏆 032" -> "🏆 032"
     */
    ORPHAN_EMOJI_REGEX: /^[ \t]*(?:\/-[a-zA-Z0-9_]+|🌷|🌸|🌺|🌻|🌹|💐|🍾)[ \t]*(?=(?:(?:Mã|MÃ|mã):?|[🏆🎖️🥇⭐📍🏢☘⌛]|TL\d*))/gui,

    /**
     * 3. Regular Expression Loại Bỏ Header Reply Quote Cũ (Reply Quote Regex)
     * Loại bỏ phần banner trích dẫn tin nhắn cũ của Zalo khi văn bản bôi đen bị dính header
     */
    REPLY_QUOTE_REGEX: /^[ \t]*[a-zA-ZÀ-ỹ0-9_ ][a-zA-ZÀ-ỹ0-9_ ]{1,34}[ \t]*\n(?:[ \t]*[^\n]*?(?:[hH][hH]|[hH]oa[ \t]*hồng|Mã|MÃ|mã|[-•\u1F300-\u1F9FF🌷🌸🌺🌻🌹💐🏢⌛☘🏆⭐📍])[^\n]*\n){1,3}(?=[ \t]*(?:(?:[hH][hH]|[hH]oa[ \t]*hồng|Mã|MÃ|mã|[-•\u1F300-\u1F9FF🌷🌸🌺🌻🌹💐🏢⌛☘🏆⭐📍]|\d|[a-zA-Z])))/gui,

    /**
     * 4. Regular Expression Lọc Dòng Hoa Hồng Đứng Độc Lập (%)
     * Nhận diện các dòng chỉ chứa % hoa hồng và thời hạn đứng thành 1 dòng riêng (hỗ trợ thụt lùi tab/space, đa mốc | và ngoặc đơn):
     * - "      35%-12th | 25%-6th ( Chủ dẫn)"
     * - "30%-6th", "🌷 40%-12th", "🌷40%_12th ( ctv dẫn)", "/-rose 35%", "🌷35%-hd 31/8/2027", " (Chốt đúng giá, fix giá hh 30%)"
     */
    COMMISSION_LINE_PERCENT_REGEX: new RegExp(
      `^[ \\t]*(?:(?:${P.HEADER_PREFIX}[ \\t]*)?${P.COMM_CHAIN}|(?:${P.HEADER_PREFIX}[ \\t]*)?${P.NOTE_STANDALONE})[ \\t]*$`,
      'iu'
    ),

    /**
     * 5. Regular Expression Lọc Dòng Hoa Hồng Số Tiền Đứng Độc Lập (tr/triệu/k)
     * Nhận diện dòng hoa hồng tiền mặt đứng riêng (bắt buộc có HH/emoji + tiền tố + thời hạn hợp đồng, tránh xóa nhầm dòng giá nhà "4tr8-301"):
     * - "🌷1tr1 - 6-12m", "HH 2tr hd 1 năm"
     */
    COMMISSION_LINE_MONEY_REGEX: new RegExp(
      `^[ \\t]*(?:${P.EMOJI_PREFIX}[ \\t]*|(?:HH|Hoa[ \\t]*hồng|Chủ[ \\t]*dẫn|CD|CTV|Ctv):?[ \\t]*)+[ \\t]*\\d+(?:[\\.,]\\d+)?[ \\t]*(?:tr|triệu|k)[ \\t]*\\d*[ \\t]*${P.DURATION}[ \\t]*${P.NOTE_BRACKET}[ \\t]*$`,
      'iu'
    ),

    /**
     * 6. Regular Expression Lọc Dòng Ghi Chú / Thông Báo Thưởng Sale, Thưởng Nóng, Bonus, Chính Sách Nội Bộ
     * Nhận diện các dòng thông báo thưởng nóng / thưởng sale / chính sách chốt cọc độc lập:
     * - "GIỮ PHÒNG ĐẾN HẾT THÁNG 8 NẾU KHÁCH CHỐT ĐÚNG GIÁ. CÓ FIX GIÁ CHO KHÁCH CHUYỂN VÀO Ở LUÔN HOẶC THƯỞNG SALE 500K/PHÒNG NẾU KHÁCH CHỐT ĐÚNG GIÁ VÀ CHUYỂN VÀO TRƯỚC 15/8"
     * - "THƯỞNG SALE 500K/PHÒNG NẾU KHÁCH CHỐT ĐÚNG GIÁ VÀ CHUYỂN VÀO TRƯỚC 15/8"
     * - "🔥 THƯỞNG NÓNG SALE 500K/PHÒNG 🔥"
     * - "Thưởng sale 500k/phòng", "Thưởng nóng 1tr", "Bonus sale 500k", "Hỗ trợ sale 500k"
     */
    COMMISSION_LINE_BONUS_REGEX: /(?:[tT]hưởng[ \t]*(?:[nN]óng[ \t]*)?(?:[sS]ale|[cC]tv|cho[ \t]*[sS]ale|cho[ \t]*[cC]tv|môi[ \t]*giới)|[bB]onus[ \t]*(?:[sS]ale|[cC]tv)|(?:[hH]ỗ[ \t]*trợ|[tT]ặng)[ \t]+(?:[sS]ale|[cC]tv)|[tT]hưởng[ \t]+[nN]óng|[tT]hưởng[ \t]+\d+(?:[\.,]\d+)?[ \t]*(?:k|tr|triệu|đ|vnd)?[ \t]*(?:\/[ \t]*(?:phòng|căn|p|hđ|hợp[ \t]*đồng))?[ \t]*(?:cho[ \t]*)?(?:sale|ctv|môi[ \t]*giới))/iu
  };

  // Export to Global Scope
  if (typeof window !== 'undefined') {
    window.ZaloQuickActionFilterRules = FilterRules;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.ZaloQuickActionFilterRules = FilterRules;
  }
})();
