using AppForms.Shared.Enums;

namespace AppForms.Shared.Models.Routing;

/// <summary>
/// Metadata mô tả cấu hình của một tuyến màn hình (Route)
/// </summary>
public record AppRouteDescriptor(
    AppRouteId RouteId,
    string DisplayTitle,
    string IconSymbol,
    string Description,
    int DisplayOrder,
    bool ShowInHeaderNav,
    bool ShowInDashboardLaunchpad,
    bool HasBackgroundService,
    string? AssociatedFeatureId = null
);
