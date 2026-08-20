using AppForms.Backend.Contracts.Interfaces;
using AppForms.Frontend.Screens.Dashboard.Models;
using AppForms.Shared.Constants;
using AppForms.Shared.Enums;
using Microsoft.Extensions.Logging;

namespace AppForms.Frontend.Screens.Dashboard.Hooks;

/// <summary>
/// Hook quản lý state và hành động của màn hình Dashboard
/// </summary>
public class DashboardStateHook
{
    private readonly ILogger<DashboardStateHook> _logger;
    private readonly INavigationService _navigationService;
    private readonly IBackgroundFeatureRegistry _featureRegistry;
    private readonly ISettingsService _settingsService;
    private readonly IRoomCodeReadOnlyRepository _roomCodeRepo;

    public DashboardFormModel CurrentModel { get; private set; } = null!;

    public event Action? StateUpdated;
    public event Action<string>? ErrorOccurred;

    public DashboardStateHook(
        ILogger<DashboardStateHook> logger,
        INavigationService navigationService,
        IBackgroundFeatureRegistry featureRegistry,
        ISettingsService settingsService,
        IRoomCodeReadOnlyRepository roomCodeRepo)
    {
        _logger = logger;
        _navigationService = navigationService;
        _featureRegistry = featureRegistry;
        _settingsService = settingsService;
        _roomCodeRepo = roomCodeRepo;

        RegisterEvents();
        RefreshData();
    }

    private void RegisterEvents()
    {
        _featureRegistry.FeatureStateChanged += (_, _) =>
        {
            _logger.LogInformation("DashboardStateHook: Nhận tín hiệu FeatureStateChanged -> Cập nhật State");
            RefreshData();
        };

        _settingsService.SettingsSaved += (_, _) =>
        {
            _logger.LogInformation("DashboardStateHook: Nhận tín hiệu SettingsSaved -> Cập nhật State");
            RefreshData();
        };
    }

    public void RefreshData()
    {
        var backgroundServices = _featureRegistry.GetAllFeatureStatuses();
        var statusDict = backgroundServices.ToDictionary(s => s.FeatureId, s => s);

        var launchpadRoutes = _navigationService.RegisteredRoutes
            .Where(r => r.ShowInDashboardLaunchpad)
            .OrderBy(r => r.DisplayOrder)
            .ToList();

        var featureCards = new List<DashboardFeatureCardItem>();
        foreach (var route in launchpadRoutes)
        {
            bool isRunning = false;
            DateTime? lastActivity = null;

            if (route.HasBackgroundService && !string.IsNullOrEmpty(route.AssociatedFeatureId))
            {
                if (statusDict.TryGetValue(route.AssociatedFeatureId, out var status))
                {
                    isRunning = status.IsRunning;
                    lastActivity = status.LastActivityTime;
                }
            }

            featureCards.Add(new DashboardFeatureCardItem(
                RouteId: route.RouteId,
                DisplayTitle: route.DisplayTitle,
                IconSymbol: route.IconSymbol,
                Description: route.Description,
                HasBackgroundService: route.HasBackgroundService,
                AssociatedFeatureId: route.AssociatedFeatureId,
                IsRunning: isRunning,
                LastActivityTime: lastActivity
            ));
        }

        var ctvName = string.IsNullOrWhiteSpace(_settingsService.Current.FixedCtvName)
            ? "(Chưa đặt tên)"
            : _settingsService.Current.FixedCtvName;

        var totalRooms = _roomCodeRepo.GetAllGroupCodes().Values.Sum(codes => codes.Count);
        var runningCount = backgroundServices.Count(s => s.IsRunning);
        var totalCount = backgroundServices.Count;

        var statusSummary = runningCount > 0
            ? $"🟢 {runningCount}/{totalCount} dịch vụ ngầm đang hoạt động"
            : "⚪ Tất cả dịch vụ ngầm đang tạm dừng";

        CurrentModel = new DashboardFormModel(
            CtvName: ctvName,
            AppVersion: AppConstants.AppVersion,
            TotalRoomsCount: totalRooms,
            FeatureCards: featureCards,
            RunningServicesCount: runningCount,
            TotalServicesCount: totalCount,
            StatusSummary: statusSummary
        );

        StateUpdated?.Invoke();
    }

    public bool NavigateTo(AppRouteId routeId)
    {
        _logger.LogInformation("DashboardStateHook: Yêu cầu chuyển đến Route {RouteId}", routeId);
        return _navigationService.NavigateTo(routeId);
    }

    public void ToggleBackgroundService(string featureId, bool enable, IntPtr windowHandle)
    {
        _logger.LogInformation("DashboardStateHook: Chuyển đổi trạng thái dịch vụ {FeatureId} -> {Enable}", featureId, enable);
        var result = _featureRegistry.ToggleFeature(featureId, enable, windowHandle);
        if (result.IsFailure)
        {
            _logger.LogWarning("DashboardStateHook: Toggle thất bại - {Error}", result.Error);
            ErrorOccurred?.Invoke(result.Error);
        }
        RefreshData();
    }
}
