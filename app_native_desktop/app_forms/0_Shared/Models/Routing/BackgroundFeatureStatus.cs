namespace AppForms.Shared.Models.Routing;

/// <summary>
/// DTO chứa trạng thái thời gian thực của một dịch vụ chạy ngầm trong hệ thống
/// </summary>
public record BackgroundFeatureStatus(
    string FeatureId,
    string DisplayName,
    string Description,
    string IconSymbol,
    bool IsRunning,
    DateTime? LastActivityTime = null
);
