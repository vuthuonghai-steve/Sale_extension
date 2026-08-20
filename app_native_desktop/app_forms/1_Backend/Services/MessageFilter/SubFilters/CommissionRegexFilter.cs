using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Services.MessageFilter.Helpers;
using AppForms.Shared.Models.MessageFilter;

namespace AppForms.Backend.Services.MessageFilter.SubFilters;

/// <summary>
/// Sub-module lọc toàn diện thông tin hoa hồng, phí môi giới, thưởng sale và chính sách chốt cọc
/// </summary>
public class CommissionRegexFilter : IClipboardFilter
{
    public string Name => "Commission & Bonus Policy Filter";
    public int Priority => 5;

    public bool IsEnabled(FilterPipelineOptions options) => options.EnableCommissionFilter;

    public string Process(string text)
    {
        if (string.IsNullOrEmpty(text)) return text;

        // 1. Loại bỏ thông tin Hoa hồng dính trước Mã / Cúp
        string result = FilterRegexPatterns.CommissionRegex.Replace(text, "");

        // 2. Loại bỏ emoji hoa hồng mồ côi đứng trước Mã / Cúp
        result = FilterRegexPatterns.OrphanEmojiRegex.Replace(result, "");

        // 3. Quét và lọc theo từng dòng (Line-by-line Filtering không tạo mảng tạm)
        using var reader = new StringReader(result);
        var sb = new System.Text.StringBuilder(result.Length);
        string? rawLine;
        bool isFirst = true;

        while ((rawLine = reader.ReadLine()) != null)
        {
            string line = rawLine.TrimEnd('\r', ' ', '\t');
            string trimmed = line.Trim();

            if (string.IsNullOrEmpty(trimmed))
            {
                if (!isFirst) sb.Append('\n');
                sb.Append(line);
                isFirst = false;
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

            if (!isFirst)
            {
                sb.Append('\n');
            }
            sb.Append(line);
            isFirst = false;
        }

        return sb.ToString();
    }
}
