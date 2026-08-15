using System.Text.RegularExpressions;
using ClipboardFilterApp.Contracts;

namespace ClipboardFilterApp.Modules.CompositeModules;

/// <summary>
/// Composite Module điều phối toàn bộ chuỗi Pipeline gồm nhiều Sub-Modules lọc khác nhau
/// </summary>
public class ClipboardPipelineManager
{
    private readonly List<IClipboardFilter> _filters;
    private readonly FilterOptions _options;

    private static readonly Regex MultiSpaceTabRegex = new(@"[ \t]+", RegexOptions.Compiled | RegexOptions.CultureInvariant);
    private static readonly Regex MultiNewlineRegex = new(@"\n{3,}", RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public ClipboardPipelineManager(FilterOptions options, IEnumerable<IClipboardFilter> filters)
    {
        _options = options;
        _filters = filters.OrderBy(f => f.Priority).ToList();
    }

    public string Process(string rawText)
    {
        if (string.IsNullOrEmpty(rawText)) return rawText;
        if (rawText.Length > _options.MaxPayloadCharacterLimit) return rawText;

        // Chuẩn hóa trước khi đưa vào chuỗi bộ lọc
        string currentText = Normalize(rawText);

        foreach (var filter in _filters)
        {
            if (!filter.IsEnabled(_options)) continue;
            currentText = filter.Process(currentText);
        }

        // Chuẩn hóa sau khi qua toàn bộ bộ lọc
        return Normalize(currentText);
    }

    /// <summary>
    /// Chuẩn hóa khoảng trắng và dấu xuống dòng đồng bộ với Extension:
    /// - Thay \r\n thành \n
    /// - Thu gọn khoảng trắng/tab liên tiếp thành 1 khoảng trắng
    /// - Nén từ 3 dấu xuống dòng liên tiếp trở lên thành 2 dấu xuống dòng (\n\n)
    /// - Trim đầu và cuối chuỗi
    /// </summary>
    public static string Normalize(string rawText)
    {
        if (string.IsNullOrEmpty(rawText)) return string.Empty;

        string normalized = rawText.Replace("\r\n", "\n").Replace("\r", "\n");
        normalized = MultiSpaceTabRegex.Replace(normalized, " ");
        normalized = MultiNewlineRegex.Replace(normalized, "\n\n");

        return normalized.Trim();
    }
}
