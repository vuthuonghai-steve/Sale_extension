namespace AppForms.Backend.Contracts.Rules;

/// <summary>
/// Hợp đồng quy tắc phân vùng (Zone Rule) xử lý và chuẩn hóa mã phòng đặc thù theo từng nhóm/sàn.
/// Cho phép bóc tách tiền tố/hậu tố hoặc biến thể đầu vào mà không can thiệp vào kho dữ liệu gốc.
/// </summary>
public interface ISpecialMappingZoneRule
{
    /// <summary>
    /// Tên định danh của quy tắc phân vùng.
    /// </summary>
    string ZoneName { get; }

    /// <summary>
    /// Độ ưu tiên thực thi của quy tắc (Số càng lớn, ưu tiên càng cao).
    /// </summary>
    int Priority { get; }

    /// <summary>
    /// Thử phân giải và chuẩn hóa mã đầu vào thành các mã định danh ứng viên khả dĩ.
    /// </summary>
    /// <param name="rawCode">Mã phòng đầu vào chưa chuẩn hóa.</param>
    /// <param name="candidateCodes">Danh sách mã ứng viên sau khi đã bóc tách/chuẩn hóa.</param>
    /// <returns>True nếu quy tắc khớp và sinh ra ít nhất một mã ứng viên hợp lệ.</returns>
    bool TryResolveCandidates(string rawCode, out IEnumerable<string> candidateCodes);
}
