namespace AppForms.Backend.Contracts.Interfaces;

/// <summary>
/// Platform Abstraction Interface cho thao tác đọc/ghi Clipboard hệ điều hành.
/// Giúp tách biệt hoàn toàn Backend khỏi thư viện WinForms UI (System.Windows.Forms.Clipboard).
/// </summary>
public interface IClipboardAdapter
{
    /// <summary>
    /// Ghi văn bản vào Clipboard hệ thống.
    /// </summary>
    bool SetText(string text);

    /// <summary>
    /// Đọc văn bản từ Clipboard hệ thống (trả về null nếu không có hoặc không thể truy cập).
    /// </summary>
    string? GetText();

    /// <summary>
    /// Kiểm tra xem Clipboard hiện tại có chứa nội dung văn bản không.
    /// </summary>
    bool ContainsText();

    /// <summary>
    /// Xóa sạch dữ liệu trong Clipboard.
    /// </summary>
    bool Clear();
}
