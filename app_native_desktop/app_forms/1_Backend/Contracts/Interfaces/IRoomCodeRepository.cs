using AppForms.Shared.Common;

namespace AppForms.Backend.Contracts.Interfaces;

/// <summary>
/// Interface CHỈ ĐỌC - Dành cho SchemaDetectorService và LeadConverterScreen
/// </summary>
public interface IRoomCodeReadOnlyRepository
{
    /// <summary>
    /// Tra cứu SchemaId từ mã phòng (O(1) trong bộ nhớ RAM)
    /// </summary>
    string? GetSchemaIdByCode(string roomCode);

    /// <summary>
    /// Lấy danh sách mã phòng của một Schema cụ thể
    /// </summary>
    IReadOnlyList<string> GetCodesBySchema(string schemaId);

    /// <summary>
    /// Lấy toàn bộ danh mục mã phân theo từng SchemaId
    /// </summary>
    IReadOnlyDictionary<string, List<string>> GetAllGroupCodes();

    /// <summary>
    /// Lấy tên hiển thị của nhóm theo SchemaId
    /// </summary>
    string? GetGroupName(string schemaId);
}

/// <summary>
/// Interface TOÀN QUYỀN - CHỈ INJECT VÀO SettingsScreen / SettingsStateHook
/// </summary>
public interface IRoomCodeRepository : IRoomCodeReadOnlyRepository
{
    /// <summary>
    /// Thêm hoặc đăng ký danh sách mã phòng vào một SchemaId
    /// </summary>
    Result RegisterCodes(string schemaId, IEnumerable<string> roomCodes);

    /// <summary>
    /// Xóa danh sách mã phòng khỏi một SchemaId
    /// </summary>
    Result RemoveCodes(string schemaId, IEnumerable<string> roomCodes);

    /// <summary>
    /// Nạp lại dữ liệu từ file lưu trữ
    /// </summary>
    Result Reload();

    /// <summary>
    /// Lưu dữ liệu hiện tại xuống file an toàn (Atomic File Write)
    /// </summary>
    Result Save();
}
