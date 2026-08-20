using AppForms.Backend.Contracts.Interfaces;
using AppForms.Frontend.Screens.Dashboard.Components;
using AppForms.Frontend.Screens.Dashboard.Hooks;
using AppForms.Frontend.Shared.Components;
using AppForms.Frontend.Shared.Hooks;
using AppForms.Frontend.Shared.Theme;
using Microsoft.Extensions.Logging;

namespace AppForms.Frontend.Screens.Dashboard;

/// <summary>
/// Màn hình Dashboard Tổng Quan (Root Screen) - Điểm điều phối và theo dõi trạng thái hệ thống
/// </summary>
public class DashboardScreen : UserControl
{
    private readonly DashboardStateHook _hook;
    private readonly SystemMetricsSummaryPanel _metricsPanel;
    private readonly UnifiedFeatureCardPanel _featureCardsPanel;

    public event Action<string>? StatusMessageUpdated;

    public DashboardScreen(
        ILogger<DashboardStateHook> hookLogger,
        INavigationService navigationService,
        IBackgroundFeatureRegistry featureRegistry,
        ISettingsService settingsService,
        IRoomCodeReadOnlyRepository roomCodeRepo)
    {
        _hook = new DashboardStateHook(hookLogger, navigationService, featureRegistry, settingsService, roomCodeRepo);

        _metricsPanel = new SystemMetricsSummaryPanel();
        _featureCardsPanel = new UnifiedFeatureCardPanel();

        InitializeLayout();
        RegisterHookEvents();
        RefreshUI();
    }

    private void InitializeLayout()
    {
        Dock = DockStyle.Fill;
        BackColor = AppColors.BackgroundDark;
        Padding = new Padding(8, 8, 2, 8);

        var scrollPanel = new SlimScrollPanel { Dock = DockStyle.Fill };

        // Thêm vào scrollPanel.Content theo thứ tự Z-order Dock Top từ dưới lên trên
        scrollPanel.Content.Controls.Add(_featureCardsPanel);
        scrollPanel.Content.Controls.Add(_metricsPanel);

        Controls.Add(scrollPanel);
    }

    private void RegisterHookEvents()
    {
        _hook.StateUpdated += () => FormStateObserver.InvokeOnUI(this, RefreshUI);

        _hook.ErrorOccurred += error => FormStateObserver.InvokeOnUI(this, () =>
        {
            StatusMessageUpdated?.Invoke($"❌ Lỗi: {error}");
        });

        _featureCardsPanel.RouteSelected += routeId =>
        {
            _hook.NavigateTo(routeId);
        };

        _featureCardsPanel.ToggleRequested += (featureId, enable) =>
        {
            _hook.ToggleBackgroundService(featureId, enable, FindForm()?.Handle ?? Handle);
            StatusMessageUpdated?.Invoke($"Đã gửi lệnh {(enable ? "BẬT" : "TẮT")} dịch vụ ngầm.");
        };
    }

    public void RefreshUI()
    {
        _metricsPanel.BindData(_hook.CurrentModel);
        _featureCardsPanel.BindData(_hook.CurrentModel.FeatureCards);
    }

    public void NotifySettingsUpdated()
    {
        _hook.RefreshData();
    }
}
