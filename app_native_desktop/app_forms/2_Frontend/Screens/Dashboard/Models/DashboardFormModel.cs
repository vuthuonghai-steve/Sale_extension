using AppForms.Shared.Enums;

namespace AppForms.Frontend.Screens.Dashboard.Models;

/// <summary>
/// DTO biểu diễn một thẻ tính năng tích hợp lối tắt điều hướng và công tắc dịch vụ ngầm
/// </summary>
public record DashboardFeatureCardItem(
    AppRouteId RouteId,
    string DisplayTitle,
    string IconSymbol,
    string Description,
    bool HasBackgroundService,
    string? AssociatedFeatureId,
    bool IsRunning,
    DateTime? LastActivityTime
);

/// <summary>
/// DTO chứa toàn bộ dữ liệu trạng thái phục vụ hiển thị trên Dashboard UI
/// </summary>
public record DashboardFormModel(
    string CtvName,
    string AppVersion,
    int TotalRoomsCount,
    IReadOnlyList<DashboardFeatureCardItem> FeatureCards,
    int RunningServicesCount,
    int TotalServicesCount,
    string StatusSummary
);
