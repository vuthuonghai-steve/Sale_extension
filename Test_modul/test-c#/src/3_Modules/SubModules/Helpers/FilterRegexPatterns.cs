using System.Text.RegularExpressions;

namespace ClipboardFilterApp.Modules.SubModules.Helpers;

/// <summary>
/// Chứa toàn bộ Sub-Patterns và Compiled Regex chuẩn hóa từ bộ quy tắc lọc của Chrome Extension
/// </summary>
public static class FilterRegexPatterns
{
    // =========================================================================
    // 🧩 SUB-PATTERNS REGEX BUILDING BLOCKS
    // =========================================================================
    public static class Patterns
    {
        // Ký tự Emoji/Biểu tượng tiền tố hoa hồng (🌷, 🌸, 🌺, 🌻, 🌹, 💐, 🍾, /-rose...)
        public const string EmojiPrefix = @"(?:\/-[a-zA-Z0-9_]+|🌷|🌸|🌺|🌻|🌹|💐|🍾)";

        // Tiền tố từ khóa Hoa hồng (HH, Hoa hồng, Hh...)
        public const string KeywordPrefix = @"(?:[hH][hH]|[hH]oa[ \t]*hồng)";

        // Tổng hợp tiền tố nhận diện Hoa hồng (Emoji hoặc Từ khóa HH)
        public const string HeaderPrefix = @"(?:(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?|(?:\/-[a-zA-Z0-9_]+|🌷|🌸|🌺|🌻|🌹|💐|🍾))[ \t]*(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?[ \t]*)?)";

        // Thời hạn hợp đồng / hạn thuê (VD: 12th, _12th, 6-12m, hd 30/7/2027, hạn đến 31/8/2027)
        public const string Duration = @"(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—_]+(?:[ \t]*[-–—_][ \t]*[\d\/\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)";

        // Ghi chú đính kèm trong ngoặc đơn hoặc dấu gạch ngang
        public const string NoteBracket = @"(?:\([ \t]*[^\n)]*\)|(?:[+&,; \t–—_\/-]*)(?:[cC]hủ[ \t]*dẫn|[cC]tv[ \t]*dẫn|[cC][tT][vV]|[cC][dD]|[cC]hốt|[cC]hốt[ \t]*ở|[fF]ix|[fF]ix[ \t]*giá|[kK]hách[ \t]*dẫn|[tT]hưởng[ \t]*(?:[nN]óng[ \t]*)?(?:[sS]ale|[cC]tv)?|[bB]onus[ \t]*(?:[sS]ale|[cC]tv)?):?[ \t]*(?:\d{1,3}[ \t]*%|\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*)[ \t]*(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—_]+(?:[ \t]*[-–—_][ \t]*[\d\/\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)?";

        // Mốc hoa hồng phần trăm đơn lẻ
        public const string PercentSingle = @"(?:\d{1,3}[ \t]*%[ \t]*(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—_]+(?:[ \t]*[-–—_][ \t]*[\d\/\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)";

        // Chuỗi đa mốc hoa hồng phần trăm liên tiếp
        public const string PercentMulti = @"(?:" + PercentSingle + @"(?:[ \t]*(?:[|/,\-–—_])[ \t]*" + PercentSingle + @")*)";

        // Mốc hoa hồng tiền mặt đơn lẻ
        public const string MoneySingle = @"(?:\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*[ \t]*[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—_]+(?:[ \t]*[-–—_][ \t]*[\d\/\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM]))";

        // Ghi chú hoa hồng đứng độc lập 1 dòng
        public const string NoteStandalone = @"(?:\([ \t]*.*?(?:[cC]hủ[ \t]*dẫn|[cC]tv[ \t]*dẫn|[cC][tT][vV]|[cC][dD]|[cC]hốt|[hH][hH]|[hH]oa[ \t]*hồng|[fF]ix[ \t]*giá|[fF]ix|[kK]hách[ \t]*dẫn|[tT]hưởng|[bB]onus|[hH]ỗ[ \t]*trợ|[tT]ặng).*?\)|(?:[-–—_][ \t]*)?(?:[cC]hủ[ \t]*dẫn|[cC]tv[ \t]*dẫn|[cC][tT][vV]|[cC][dD]|[cC]hốt|[cC]hốt[ \t]*ở|[kK]hách[ \t]*dẫn|[tT]hưởng[ \t]*(?:[nN]óng[ \t]*)?(?:[sS]ale|[cC]tv)?|[bB]onus[ \t]*(?:[sS]ale|[cC]tv)?):?[ \t]*(?:\d{1,3}[ \t]*%|\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*|.*?))";

        // Phân đoạn hoa hồng hoàn chỉnh (Segment)
        public const string CommSegment = @"(?:(?:(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?|(?:\/-[a-zA-Z0-9_]+|🌷|🌸|🌺|🌻|🌹|💐|🍾))[ \t]*(?:(?:[hH][hH]|[hH]oa[ \t]*hồng):?[ \t]*)?)?(?:(?:\d{1,3}[ \t]*%[ \t]*(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—_]+(?:[ \t]*[-–—_][ \t]*[\d\/\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)|(?:\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*[ \t]*[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—_]+(?:[ \t]*[-–—_][ \t]*[\d\/\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])))[ \t]*(?:\([ \t]*[^\n)]*\)|(?:[+&,; \t–—_\/-]*)(?:[cC]hủ[ \t]*dẫn|[cC]tv[ \t]*dẫn|[cC][tT][vV]|[cC][dD]|[cC]hốt|[cC]hốt[ \t]*ở|[fF]ix|[fF]ix[ \t]*giá|[kK]hách[ \t]*dẫn|[tT]hưởng[ \t]*(?:[nN]óng[ \t]*)?(?:[sS]ale|[cC]tv)?|[bB]onus[ \t]*(?:[sS]ale|[cC]tv)?):?[ \t]*(?:\d{1,3}[ \t]*%|\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*)[ \t]*(?:[-–—_]?[ \t]*(?:hd|HĐ|hạn|Hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—_]+(?:[ \t]*[-–—_][ \t]*[\d\/\.]+)*[ \t]*(?:[mM]|[tT]|[tT][hH]|[tT][hH]á[nN][gG]|[nN]ă[mM])?)?)?)";

        // Chuỗi nhiều phân đoạn hoa hồng liên tiếp (Chain)
        public const string CommChain = @"(?:" + CommSegment + @"(?:(?:[ \t]*(?:[|/,\-–—_])[ \t]*|[ \t]+)" + CommSegment + @")*)";
    }

    // =========================================================================
    // 🚀 COMPILED REGEX INSTANCES
    // =========================================================================

    /// <summary>
    /// 1. Regex Lọc Hoa Hồng Dính Trước Mã (Commission Regex)
    /// </summary>
    public static readonly Regex CommissionRegex = new(
        @"(?:(?<=\n|^)[ \t]*)?" + Patterns.CommChain + @"[ \t]*(?:[\.\-–—_][ \t]*)?(?=[ \t]*[-([{:–—_ \t]*(?:(?:Mã|MÃ|mã):?|[🏆🎖️🥇⭐📍🏢☘⌛]|TL\d*)|[ \t]*(?:\n|$))",
        RegexOptions.Compiled | RegexOptions.IgnoreCase
    );

    /// <summary>
    /// 2. Regex Lọc Thương Hiệu / Tag Nhóm Hàng (Branding Regex)
    /// </summary>
    public static readonly Regex BrandRegex = new(
        @"(?:[•\-–—][ \t]*)?[🏆🎖️🥇⭐]*[ \t]*(?:Nguồn[ \t]+hàng[ \t]+cập[ \t]+nhật[ \t]+liên[ \t]+tục[ \t]+tại[ \t]*)?[🏆🎖️🥇⭐]*[ \t]*TL[ \t]*\d*[ \t]*House[ \t]*[🏆🎖️🥇⭐]*",
        RegexOptions.Compiled | RegexOptions.IgnoreCase
    );

    /// <summary>
    /// 2.5 Regex Lọc Emoji Hoa Hồng Mồ Côi Đứng Trước Mã (Orphan Emoji Regex)
    /// </summary>
    public static readonly Regex OrphanEmojiRegex = new(
        @"(?<=^|\n)[ \t]*(?:\/-[a-zA-Z0-9_]+|🌷|🌸|🌺|🌻|🌹|💐|🍾)[ \t]*(?=(?:(?:Mã|MÃ|mã):?|[🏆🎖️🥇⭐📍🏢☘⌛]|TL\d*))",
        RegexOptions.Compiled | RegexOptions.IgnoreCase
    );

    /// <summary>
    /// 3. Regex Loại Bỏ Header Reply Quote Cũ (Reply Quote Regex)
    /// </summary>
    public static readonly Regex ReplyQuoteRegex = new(
        @"^[ \t]*[a-zA-ZÀ-ỹ0-9_ ][a-zA-ZÀ-ỹ0-9_ ]{1,34}[ \t]*\n(?:[ \t]*[^\n]*?(?:[hH][hH]|[hH]oa[ \t]*hồng|Mã|MÃ|mã|[-•\uD83C-\uDBFF\uDC00-\uDFFF🌷🌸🌺🌻🌹💐🏢⌛☘🏆⭐📍])[^\n]*\n){1,3}(?=[ \t]*(?:(?:[hH][hH]|[hH]oa[ \t]*hồng|Mã|MÃ|mã|[-•\uD83C-\uDBFF\uDC00-\uDFFF🌷🌸🌺🌻🌹💐🏢⌛☘🏆⭐📍]|\d|[a-zA-Z])))",
        RegexOptions.Compiled | RegexOptions.IgnoreCase
    );

    /// <summary>
    /// 4. Regex Lọc Dòng Hoa Hồng Đứng Độc Lập (%)
    /// </summary>
    public static readonly Regex CommissionLinePercentRegex = new(
        @"^[ \t]*(?:(?:" + Patterns.HeaderPrefix + @"[ \t]*)?" + Patterns.CommChain + @"|(?:" + Patterns.HeaderPrefix + @"[ \t]*)?" + Patterns.NoteStandalone + @")[ \t]*$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase
    );

    /// <summary>
    /// 5. Regex Lọc Dòng Hoa Hồng Số Tiền Đứng Độc Lập (tr/triệu/k)
    /// </summary>
    public static readonly Regex CommissionLineMoneyRegex = new(
        @"^[ \t]*(?:" + Patterns.EmojiPrefix + @"[ \t]*|(?:HH|Hoa[ \t]*hồng|Chủ[ \t]*dẫn|CD|CTV|Ctv):?[ \t]*)+[ \t]*\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*[ \t]*" + Patterns.Duration + @"[ \t]*" + Patterns.NoteBracket + @"[ \t]*$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase
    );

    /// <summary>
    /// 6. Regex Lọc Dòng Ghi Chú / Thông Báo Thưởng Sale, Thưởng Nóng, Bonus, Chính Sách Nội Bộ
    /// </summary>
    public static readonly Regex CommissionLineBonusRegex = new(
        @"(?:[tT]hưởng[ \t]*(?:[nN]óng[ \t]*)?(?:[sS]ale|[cC]tv|cho[ \t]*[sS]ale|cho[ \t]*[cC]tv|môi[ \t]*giới)|[bB]onus[ \t]*(?:[sS]ale|[cC]tv)|(?:[hH]ỗ[ \t]*trợ|[tT]ặng)[ \t]+(?:[sS]ale|[cC]tv)|[tT]hưởng[ \t]+[nN]óng|[tT]hưởng[ \t]+\d+(?:[\.,]\d+)?[ \t]*(?:k|tr|triệu|đ|vnd)?[ \t]*(?:\/[ \t]*(?:phòng|căn|p|hđ|hợp[ \t]*đồng))?[ \t]*(?:cho[ \t]*)?(?:sale|ctv|môi[ \t]*giới))",
        RegexOptions.Compiled | RegexOptions.IgnoreCase
    );

    /// <summary>
    /// Regex kiểm tra xem dòng có chứa các tiền tố mã/địa chỉ để bảo vệ không bị xóa nhầm khi có chứa từ khóa thưởng
    /// </summary>
    public static readonly Regex ProtectedLinePrefixRegex = new(
        @"^(?:(?:Mã|MÃ|mã):?|[🏆🎖️🥇⭐📍🏢☘⌛]|TL\d*)",
        RegexOptions.Compiled | RegexOptions.IgnoreCase
    );

    /// <summary>
    /// Dòng nguồn hàng rỗng
    /// </summary>
    public static readonly Regex EmptySourceLineRegex = new(
        @"^[•\-–—]?[ \t]*Nguồn[ \t]+hàng[ \t]+cập[ \t]+nhật[ \t]+liên[ \t]+tục[ \t]+tại[ \t]*:?$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase
    );
}
