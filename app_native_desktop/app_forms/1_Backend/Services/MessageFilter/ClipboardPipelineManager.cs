using System.Diagnostics;
using System.Text.RegularExpressions;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Shared.Models.MessageFilter;

namespace AppForms.Backend.Services.MessageFilter;

/// <summary>
/// Composite Module điều phối toàn bộ chuỗi Pipeline gồm nhiều Sub-Modules lọc khác nhau
/// </summary>
public class ClipboardPipelineManager
{
    private static readonly TimeSpan DefaultRegexTimeout = TimeSpan.FromMilliseconds(250);

    private readonly List<IClipboardFilter> _filters;
    private FilterPipelineOptions _options;

    private static readonly Regex MultiSpaceTabRegex = new(@"[ \t]+", RegexOptions.Compiled | RegexOptions.CultureInvariant, DefaultRegexTimeout);
    private static readonly Regex MultiNewlineRegex = new(@"\n{3,}", RegexOptions.Compiled | RegexOptions.CultureInvariant, DefaultRegexTimeout);

    public ClipboardPipelineManager(FilterPipelineOptions options, IEnumerable<IClipboardFilter> filters)
    {
        _options = options;
        _filters = filters.OrderBy(f => f.Priority).ToList();
    }

    public void UpdateOptions(FilterPipelineOptions options)
    {
        _options = options;
    }

    public string Process(string rawText)
    {
        var report = ProcessWithReport(rawText);
        return report.CleanedText;
    }

    public FilterExecutionReport ProcessWithReport(string rawText)
    {
        var sw = Stopwatch.StartNew();
        DateTime timestamp = DateTime.Now;

        if (string.IsNullOrEmpty(rawText))
        {
            sw.Stop();
            return new FilterExecutionReport(rawText, rawText, timestamp, false, sw.ElapsedMilliseconds, Array.Empty<string>());
        }

        if (rawText.Length > _options.MaxPayloadCharacterLimit)
        {
            sw.Stop();
            return new FilterExecutionReport(rawText, rawText, timestamp, false, sw.ElapsedMilliseconds, Array.Empty<string>());
        }

        // 1. Chuẩn hóa trước khi đưa vào chuỗi bộ lọc
        string currentText = Normalize(rawText);
        var appliedFilters = new List<string>();

        // 2. Chạy qua từng sub-filter
        foreach (var filter in _filters)
        {
            if (!filter.IsEnabled(_options)) continue;

            string before = currentText;
            currentText = filter.Process(currentText);

            if (!string.Equals(before, currentText, StringComparison.Ordinal))
            {
                appliedFilters.Add(filter.Name);
            }
        }

        // 3. Chuẩn hóa sau khi qua toàn bộ bộ lọc
        string finalCleanedText = Normalize(currentText);
        bool isModified = !string.Equals(rawText, finalCleanedText, StringComparison.Ordinal);

        sw.Stop();
        return new FilterExecutionReport(
            rawText,
            finalCleanedText,
            timestamp,
            isModified,
            sw.ElapsedMilliseconds,
            appliedFilters
        );
    }

    /// <summary>
    /// Chuẩn hóa khoảng trắng và dấu xuống dòng đồng bộ:
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
