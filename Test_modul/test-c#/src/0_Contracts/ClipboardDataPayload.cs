namespace ClipboardFilterApp.Contracts;

/// <summary>
/// Đối tượng chứa thông tin dữ liệu Clipboard được chuyển giao giữa các tầng
/// </summary>
public record ClipboardDataPayload(
    string RawText,
    string CleanedText,
    DateTime Timestamp,
    bool IsModified
);
