namespace AppForms.Backend.Contracts.Interfaces;

/// <summary>
/// Platform Abstraction Interface cho các tác vụ tương tác OS Shell / Tiến trình hệ thống.
/// Hỗ trợ mở trình duyệt web với URL đã được sanitize an toàn, lấy đường dẫn thực thi của ứng dụng và mở thư mục.
/// </summary>
public interface ISystemLauncherAdapter
{
    /// <summary>
    /// Mở trình duyệt mặc định với URL chỉ định một cách an toàn (chỉ chấp nhận http/https absolute URI).
    /// </summary>
    /// <param name="url">Đường dẫn trang web cần mở</param>
    /// <returns>True nếu mở tiến trình thành công, False nếu URL không hợp lệ hoặc bị OS từ chối</returns>
    bool OpenBrowser(string url);

    /// <summary>
    /// Lấy đường dẫn file thực thi (.exe) hiện tại của ứng dụng, không phụ thuộc vào WinForms Application.
    /// </summary>
    /// <returns>Đường dẫn tuyệt đối tới file thực thi</returns>
    string GetExecutablePath();

    /// <summary>
    /// Mở thư mục trên Windows Explorer.
    /// </summary>
    /// <param name="folderPath">Đường dẫn thư mục</param>
    /// <returns>True nếu thành công</returns>
    bool OpenFolder(string folderPath);
}
