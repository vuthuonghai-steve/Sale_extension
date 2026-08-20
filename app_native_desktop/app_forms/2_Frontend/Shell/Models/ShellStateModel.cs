using AppForms.Shared.Enums;

namespace AppForms.Frontend.Shell.Models;

/// <summary>
/// Model đại diện cho trạng thái hiển thị của Shell Container (Main Form)
/// </summary>
public class ShellStateModel
{
    public AppRouteId CurrentRoute { get; set; } = AppRouteId.Dashboard;
    public string RouteTitle { get; set; } = "⚡ SALE ASSISTANT";
    public string FixedCtvName { get; set; } = string.Empty;
    public bool IsPinnedTop { get; set; }
    public bool IsClipboardListening { get; set; }
    public string FooterStatus { get; set; } = string.Empty;
    public bool IsDashboard => CurrentRoute == AppRouteId.Dashboard;
}
