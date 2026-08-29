using AppForms.Shared.Common;

namespace AppForms.Backend.Adapters.Persistence.Common;

/// <summary>
/// Hợp đồng lưu trữ file JSON generic hỗ trợ nạp seed data và lưu trữ atomic an toàn.
/// </summary>
/// <typeparam name="T">Kiểu dữ liệu thực thể gốc cần lưu trữ</typeparam>
public interface IJsonFileStorage<T> where T : class, new()
{
    /// <summary>
    /// Đường dẫn file lưu trữ runtime thực tế.
    /// </summary>
    string FilePath { get; }

    /// <summary>
    /// Nạp dữ liệu từ Runtime file. Nếu chưa có hoặc lỗi, fallback sang Seed file hoặc defaultFactory.
    /// </summary>
    /// <param name="seedFileName">Tên file seed data (ví dụ: room_codes.json)</param>
    /// <param name="defaultFactory">Hàm khởi tạo giá trị mặc định khi không tìm thấy bất kỳ file nào</param>
    /// <returns>Dữ liệu đã nạp thành công hoặc thông báo lỗi</returns>
    Result<T> Load(string seedFileName, Func<T>? defaultFactory = null);

    /// <summary>
    /// Lưu an toàn dữ liệu xuống đĩa cứng sử dụng cơ chế Atomic File Write (.tmp -> overwrite).
    /// </summary>
    /// <param name="data">Dữ liệu cần lưu</param>
    Result Save(T data);
}
