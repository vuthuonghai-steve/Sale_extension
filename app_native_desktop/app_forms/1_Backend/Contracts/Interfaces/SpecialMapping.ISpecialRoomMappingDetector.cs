using AppForms.Backend.Contracts.Entities;
using AppForms.Shared.Models.SpecialMapping;

namespace AppForms.Backend.Contracts.Interfaces;

/// <summary>
/// Domain Service điều phối luồng nhận diện và khớp dữ liệu phòng đặc biệt đa tiêu chí (Fallback Algorithm).
/// </summary>
public interface ISpecialRoomMappingDetector
{
    /// <summary>
    /// Nhận diện bản ghi đối chiếu phòng đặc biệt theo thứ tự ưu tiên:
    /// 1. Khớp theo Lead.RoomCode
    /// 2. Khớp quét trong rawText
    /// 3. Khớp theo Lead.CustomerPhone
    /// </summary>
    SpecialRoomMappingEntity? Detect(LeadEntity? lead, string? rawText = null);
}
