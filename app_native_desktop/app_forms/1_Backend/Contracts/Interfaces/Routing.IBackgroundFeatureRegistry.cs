using AppForms.Shared.Common;
using AppForms.Shared.Models.Routing;

namespace AppForms.Backend.Contracts.Interfaces;

/// <summary>
/// Hợp đồng điều khiển và giám sát các dịch vụ chạy ngầm trong hệ thống
/// </summary>
public interface IBackgroundFeatureRegistry
{
    /// <summary>
    /// Bắn ra FeatureId mỗi khi dịch vụ ngầm thay đổi trạng thái (Bật/Tắt)
    /// </summary>
    event EventHandler<string>? FeatureStateChanged;

    /// <summary>
    /// Lấy danh sách toàn bộ trạng thái thời gian thực của các dịch vụ ngầm
    /// </summary>
    IReadOnlyList<BackgroundFeatureStatus> GetAllFeatureStatuses();

    /// <summary>
    /// Kích hoạt Bật hoặc Tắt một dịch vụ ngầm cụ thể
    /// </summary>
    Result ToggleFeature(string featureId, bool enable, IntPtr windowHandle);

    /// <summary>
    /// Kiểm tra trạng thái đang chạy của một dịch vụ ngầm
    /// </summary>
    bool IsFeatureRunning(string featureId);
}
