using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Services.MessageFilter.Helpers;
using AppForms.Shared.Models.MessageFilter;

namespace AppForms.Backend.Services.MessageFilter.SubFilters;

/// <summary>
/// Sub-module lọc thương hiệu nguồn hàng rác (Ví dụ: 🏆 TL21House 🏆, Nguồn hàng cập nhật liên tục tại...)
/// </summary>
public class BrandRegexFilter : IClipboardFilter
{
    public string Name => "Brand & Source Team Filter";
    public int Priority => 4;

    public bool IsEnabled(FilterPipelineOptions options) => options.EnableBrandFilter;

    public string Process(string text)
    {
        if (string.IsNullOrEmpty(text)) return text;

        // 1. Loại bỏ các cụm thương hiệu TL...House
        string cleaned = FilterRegexPatterns.BrandRegex.Replace(text, "");

        // 2. Dọn các dòng dẫn nguồn hàng còn sót lại không tạo mảng string[]
        using var reader = new StringReader(cleaned);
        var sb = new System.Text.StringBuilder(cleaned.Length);
        string? rawLine;
        bool isFirst = true;

        while ((rawLine = reader.ReadLine()) != null)
        {
            string line = rawLine.TrimEnd('\r', ' ', '\t');
            string trimmed = line.Trim();

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
