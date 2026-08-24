using AppForms.Shared.Models.SpecialMapping;

namespace AppForms.Backend.Contracts.Interfaces;

/// <summary>
/// Dịch vụ phân tích cú pháp, bóc tách Regex và chuẩn hóa token trong văn bản thô cho phòng đặc biệt.
/// </summary>
public interface ISpecialMappingTextParser
{
    /// <summary>
    /// Chuẩn hóa chuỗi mã phòng (xóa khoảng trắng thừa).
    /// </summary>
    string CleanCode(string code);

    /// <summary>
    /// Chuẩn hóa số điện thoại về định dạng chuẩn 10 chữ số (0xxxxxxxxx).
    /// </summary>
    string CleanPhone(string phone);

    /// <summary>
    /// Bóc tách các token mã và số điện thoại từ văn bản thô, tra cứu đối chiếu trong kho dữ liệu.
    /// </summary>
    SpecialRoomMappingEntity? FindMappingInText(string text, ISpecialRoomMappingRepository repository);
}
