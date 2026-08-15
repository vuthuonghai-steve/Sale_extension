using System.Text.RegularExpressions;
using ClipboardFilterApp.Contracts;
using ClipboardFilterApp.Modules.SubModules.Helpers;

namespace ClipboardFilterApp.Modules.SubModules;

/// <summary>
/// Sub-module lọc toàn diện thông tin hoa hồng, phí môi giới, thưởng sale và chính sách chốt cọc
/// </summary>
public class CommissionRegexFilter : IClipboardFilter
{
    public string Name => "Commission & Bonus Policy Filter";
    public int Priority => 5;

    public bool IsEnabled(FilterOptions options) => options.EnableCommissionFilter;

    public string Process(string text)
    {
        if (string.IsNullOrEmpty(text)) return text;

        // 1. Loại bỏ thông tin Hoa hồng dính trước Mã / Cúp
        string result = FilterRegexPatterns.CommissionRegex.Replace(text, "");

        // 2. Loại bỏ emoji hoa hồng mồ côi đứng trước Mã / Cúp
        result = FilterRegexPatterns.OrphanEmojiRegex.Replace(result, "");

        // 3. Quét và lọc theo từng dòng (Line-by-line Filtering)
        string[] lines = result.Split('\n');
        List<string> filteredLines = new();

        foreach (string rawLine in lines)
        {
            string line = rawLine.TrimEnd('\r', ' ', '\t');
            string trimmed = line.Trim();

            if (string.IsNullOrEmpty(trimmed))
            {
                filteredLines.Add(line);
                continue;
            }

            // Bỏ dòng chỉ chứa thông tin hoa hồng phần trăm đứng riêng (VD: "30%-6th", "🌷 40%-12th", "/-rose 35%")
            if (FilterRegexPatterns.CommissionLinePercentRegex.IsMatch(trimmed))
            {
                continue;
            }

            // Bỏ dòng chỉ chứa hoa hồng số tiền đứng riêng (bắt buộc có HH/Emoji + thời hạn hợp đồng)
            if (FilterRegexPatterns.CommissionLineMoneyRegex.IsMatch(trimmed))
            {
                continue;
            }

            // Bỏ dòng thông báo thưởng nóng / thưởng sale / bonus / chính sách độc lập (trừ khi dòng có chứa Mã/Địa chỉ)
            if (FilterRegexPatterns.CommissionLineBonusRegex.IsMatch(trimmed) &&
                !FilterRegexPatterns.ProtectedLinePrefixRegex.IsMatch(trimmed))
            {
                continue;
            }

            // Bỏ dòng dẫn nguồn hàng rỗng
            if (FilterRegexPatterns.EmptySourceLineRegex.IsMatch(trimmed))
            {
                continue;
            }

            filteredLines.Add(line);
        }

        return string.Join("\n", filteredLines);
    }
}
