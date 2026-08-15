namespace ClipboardFilterApp.Contracts;

/// <summary>
/// Hợp đồng chuẩn cho mọi bộ lọc văn bản trong hệ thống (Pure Filter Contract)
/// </summary>
public interface IClipboardFilter
{
    /// <summary>
    /// Tên đại diện của bộ lọc
    /// </summary>
    string Name { get; }

    /// <summary>
    /// Thứ tự thực thi trong Pipeline (Thấp thực hiện trước)
    /// </summary>
    int Priority { get; }

    /// <summary>
    /// Thực hiện lọc và dọn dẹp văn bản
    /// </summary>
    /// <param name="text">Văn bản thô cần lọc</param>
    /// <returns>Văn bản đã qua xử lý</returns>
    string Process(string text);

    /// <summary>
    /// Kiểm tra xem bộ lọc có được kích hoạt theo cấu hình hiện tại hay không
    /// </summary>
    /// <param name="options">Cấu hình bộ lọc hệ thống</param>
    /// <returns>True nếu bộ lọc được bật, ngược lại False</returns>
    bool IsEnabled(FilterOptions options);
}
