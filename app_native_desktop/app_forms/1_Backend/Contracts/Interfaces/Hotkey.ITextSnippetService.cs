namespace AppForms.Backend.Contracts.Interfaces;

/// <summary>
/// Dịch vụ quản lý và thực hiện chèn các đoạn văn bản mẫu (Text Snippets) thông qua phím tắt
/// </summary>
public interface ITextSnippetService
{
    /// <summary>
    /// Khởi tạo và đăng ký toàn bộ phím tắt mẫu mặc định (bao gồm Alt + 1 cho Divider Line)
    /// </summary>
    void InitializeDefaultSnippets();

    /// <summary>
    /// Thực hiện chèn chuỗi ký tự bất kỳ vào ứng dụng active của người dùng
    /// </summary>
    void InsertSnippet(string text);

    /// <summary>
    /// Thực hiện chèn nhanh dòng kẻ phân cách "========================"
    /// </summary>
    void InsertDividerLine();
}
