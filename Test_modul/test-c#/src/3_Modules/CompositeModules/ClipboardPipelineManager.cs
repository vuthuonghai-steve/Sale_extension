using ClipboardFilterApp.Contracts;

namespace ClipboardFilterApp.Modules.CompositeModules;

/// <summary>
/// Composite Module điều phối toàn bộ chuỗi Pipeline gồm nhiều Sub-Modules lọc khác nhau
/// </summary>
public class ClipboardPipelineManager
{
    private readonly List<IClipboardFilter> _filters = new();
    private readonly FilterOptions _options;

    public ClipboardPipelineManager(FilterOptions options, IEnumerable<IClipboardFilter> filters)
    {
        _options = options;
        _filters = filters.OrderBy(f => f.Priority).ToList();
    }

    public string Process(string rawText)
    {
        if (string.IsNullOrEmpty(rawText)) return rawText;
        if (rawText.Length > _options.MaxPayloadCharacterLimit) return rawText;

        string currentText = rawText;

        foreach (var filter in _filters)
        {
            currentText = filter.Process(currentText);
        }

        // Bước dọn dẹp khoảng trắng dòng thông minh (Bảo toàn khoảng trống phân cách đoạn UI/UX)
        return FinalWhitespaceCleanup(currentText);
    }

    /// <summary>
    /// Thuật toán dọn dẹp khoảng trắng thông minh:
    /// - Bảo toàn các dòng trống phân cách giữa các đoạn văn (UI/UX)
    /// - Thu gọn các dòng trống liên tiếp (Tránh dư thừa khoảng trắng)
    /// - Loại bỏ khoảng trắng thừa ở hai đầu từng dòng
    /// </summary>
    private static string FinalWhitespaceCleanup(string text)
    {
        if (string.IsNullOrEmpty(text)) return text;

        string[] lines = text.Split('\n');
        List<string> cleanedLines = new();

        foreach (string line in lines)
        {
            string trimmed = line.Trim('\r', ' ', '\t');
            
            if (trimmed.Length > 0)
            {
                cleanedLines.Add(trimmed);
            }
            else if (cleanedLines.Count > 0 && cleanedLines[^1].Length > 0)
            {
                // Giữ lại đúng 1 dòng trống phân cách đoạn văn
                cleanedLines.Add(string.Empty);
            }
        }

        return string.Join("\n", cleanedLines).Trim();
    }
}
