using System.Text.RegularExpressions;
using ClipboardFilterApp.Contracts;
using ClipboardFilterApp.Modules.SubModules.Helpers;

namespace ClipboardFilterApp.Modules.SubModules;

/// <summary>
/// Sub-module lọc thương hiệu nguồn hàng rác (Ví dụ: 🏆 TL21House 🏆, Nguồn hàng cập nhật liên tục tại...)
/// </summary>
public class BrandRegexFilter : IClipboardFilter
{
    public string Name => "Brand & Source Team Filter";
    public int Priority => 4;

    public bool IsEnabled(FilterOptions options) => options.EnableBrandFilter;

    public string Process(string text)
    {
        if (string.IsNullOrEmpty(text)) return text;

        // 1. Loại bỏ các cụm thương hiệu TL...House
        string cleaned = FilterRegexPatterns.BrandRegex.Replace(text, "");

        // 2. Dọn các dòng dẫn nguồn hàng còn sót lại
        string[] lines = cleaned.Split('\n');
        List<string> resultLines = new();

        foreach (string rawLine in lines)
        {
            string line = rawLine.TrimEnd('\r', ' ', '\t');
            string trimmed = line.Trim();

            if (FilterRegexPatterns.EmptySourceLineRegex.IsMatch(trimmed))
            {
                continue;
            }

            resultLines.Add(line);
        }

        return string.Join("\n", resultLines);
    }
}
