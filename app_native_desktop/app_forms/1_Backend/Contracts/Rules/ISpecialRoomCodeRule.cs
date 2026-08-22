namespace AppForms.Backend.Contracts.Rules;

/// <summary>
/// Hợp đồng quy tắc nhận diện mã phòng / trường hợp đặc biệt cho Schema Detection
/// </summary>
public interface ISpecialRoomCodeRule
{
    /// <summary>
    /// Tên định danh của quy tắc (phục vụ diagnostic logging & debug)
    /// </summary>
    string RuleName { get; }

    /// <summary>
    /// Thứ tự ưu tiên (Priority càng cao càng được đánh giá trước)
    /// </summary>
    int Priority { get; }

    /// <summary>
    /// Thử so khớp mã phòng với quy tắc
    /// </summary>
    /// <param name="roomCode">Mã phòng thô hoặc đã được chuẩn hóa sơ bộ</param>
    /// <param name="matchedSchemaId">SchemaId tương ứng nếu khớp thành công</param>
    /// <param name="reason">Lý do/chú thích kỹ thuật phục vụ debug</param>
    /// <returns>True nếu khớp quy tắc</returns>
    bool TryMatch(string roomCode, out string? matchedSchemaId, out string? reason);
}
