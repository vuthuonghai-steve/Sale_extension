using AppForms.Shared.Common;
using AppForms.Shared.Models.SpecialMapping;

namespace AppForms.Backend.Contracts.Interfaces;

/// <summary>
/// Interface kho lưu trữ dữ liệu đối chiếu mã phòng đặc biệt đa sàn (O(1) in-memory)
/// </summary>
public interface ISpecialRoomMappingRepository
{
    /// <summary>
    /// Tra cứu bản ghi đối chiếu đặc biệt từ một mã phòng cụ thể (O(1) RAM)
    /// </summary>
    SpecialRoomMappingEntity? FindMappingByCode(string roomCode);

    /// <summary>
    /// Tra cứu bản ghi đối chiếu đặc biệt từ số điện thoại chủ/quản lý
    /// </summary>
    SpecialRoomMappingEntity? FindMappingByPhone(string phone);

    /// <summary>
    /// Quét tra cứu trong chuỗi text (tìm theo mã phòng hoặc số điện thoại)
    /// </summary>
    SpecialRoomMappingEntity? FindMappingByText(string text);

    /// <summary>
    /// Lấy toàn bộ danh sách các bản ghi đối chiếu đặc biệt
    /// </summary>
    IReadOnlyList<SpecialRoomMappingEntity> GetAll();

    /// <summary>
    /// Nạp lại dữ liệu từ file
    /// </summary>
    Result Reload();

    /// <summary>
    /// Lưu dữ liệu hiện tại an toàn xuống đĩa cứng (Atomic File Write)
    /// </summary>
    Result Save();
}
