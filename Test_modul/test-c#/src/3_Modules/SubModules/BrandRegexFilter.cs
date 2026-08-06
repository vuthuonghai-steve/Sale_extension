using System.Text.RegularExpressions;
using ClipboardFilterApp.Contracts;

namespace ClipboardFilterApp.Modules.SubModules;

/// <summary>
/// Sub-module lọc thương hiệu nguồn hàng rác (Ví dụ: 🏆 TL21House 🏆, Nguồn hàng cập nhật liên tục tại...)
/// </summary>
public class BrandRegexFilter : IClipboardFilter
{
    public string Name => "Brand & Source Team Filter";
    public int Priority => 2;

    // 1. Xóa toàn bộ dòng chứa TL...House (Ví dụ: "🏆 TL21House 🏆", "• TL21House")
    private static readonly Regex BrandLinePattern = new(
        @"^[^\n]*TL\d*House[^\n]*$\n?",
        RegexOptions.Multiline | RegexOptions.IgnoreCase | RegexOptions.Compiled
    );

    // 2. Xóa toàn bộ dòng chứa "Nguồn hàng cập nhật liên tục tại" (cho dù có icon 🔥 hay bất kỳ ký tự nào)
    private static readonly Regex HeaderLinePattern = new(
        @"^[^\n]*Nguồn[ \t]+hàng[ \t]+cập[ \t]+nhật[ \t]+liên[ \t]+tục[ \t]+tại[^\n]*$\n?",
        RegexOptions.Multiline | RegexOptions.IgnoreCase | RegexOptions.Compiled
    );

    public string Process(string text)
    {
        if (string.IsNullOrEmpty(text)) return text;

        string cleaned = BrandLinePattern.Replace(text, "");
        cleaned = HeaderLinePattern.Replace(cleaned, "");

        return cleaned;
    }
}
