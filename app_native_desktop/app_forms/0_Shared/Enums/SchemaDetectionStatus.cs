namespace AppForms.Shared.Enums;

/// <summary>
/// Trạng thái nhận diện định dạng sàn (Output Schema) từ mã phòng hoặc dữ liệu lead.
/// </summary>
public enum SchemaDetectionStatus
{
    /// <summary>
    /// Không tìm thấy sàn phù hợp từ mã phòng hoặc từ khóa.
    /// </summary>
    NotFound,

    /// <summary>
    /// Nhận diện chính xác 1 sàn duy nhất.
    /// </summary>
    ExactMatch,

    /// <summary>
    /// Xung đột do mã phòng thuộc từ 2 sàn trở lên trong kho dữ liệu.
    /// </summary>
    AmbiguousConflict,

    /// <summary>
    /// Người dùng tự tay bấm chọn sàn trên giao diện.
    /// </summary>
    ManualSelected
}
