namespace AppForms.Shared.Models.MessageFilter;

/// <summary>
/// Báo cáo chi tiết kết quả thực thi chuỗi lọc tin nhắn
/// </summary>
public record FilterExecutionReport(
    string RawText,
    string CleanedText,
    DateTime Timestamp,
    bool IsModified,
    long ElapsedMilliseconds,
    IReadOnlyList<string> AppliedFilters
);
