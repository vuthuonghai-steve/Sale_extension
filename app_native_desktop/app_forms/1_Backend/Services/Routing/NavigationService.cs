using AppForms.Backend.Contracts.Interfaces;
using AppForms.Shared.Enums;
using AppForms.Shared.Models.Routing;
using Microsoft.Extensions.Logging;

namespace AppForms.Backend.Services.Routing;

/// <summary>
/// Dịch vụ quản lý điều hướng tuyến và vòng đời các màn hình
/// </summary>
public class NavigationService : INavigationService
{
    private readonly ILogger<NavigationService> _logger;
    private readonly Dictionary<AppRouteId, AppRouteDescriptor> _routeTable = new();
    private readonly Dictionary<AppRouteId, Func<object>> _screenFactories = new();
    private readonly Dictionary<AppRouteId, object> _screenInstances = new();
    private readonly object _lock = new();

    public AppRouteId CurrentRoute { get; private set; } = AppRouteId.Dashboard;

    public IReadOnlyList<AppRouteDescriptor> RegisteredRoutes
    {
        get
        {
            lock (_lock)
            {
                return _routeTable.Values.OrderBy(r => r.DisplayOrder).ToList();
            }
        }
    }

    public event EventHandler<AppRouteId>? Navigated;

    public NavigationService(ILogger<NavigationService> logger)
    {
        _logger = logger;
        InitializeDefaultRouteTable();
    }

    private void InitializeDefaultRouteTable()
    {
        RegisterRouteDescriptor(new AppRouteDescriptor(
            RouteId: AppRouteId.Dashboard,
            DisplayTitle: "🏠 Tổng Quan",
            IconSymbol: "🏠",
            Description: "Bảng điều khiển trung tâm và lối tắt nhanh",
            DisplayOrder: 1,
            ShowInHeaderNav: true,
            ShowInDashboardLaunchpad: false,
            HasBackgroundService: false
        ));

        RegisterRouteDescriptor(new AppRouteDescriptor(
            RouteId: AppRouteId.LeadConverter,
            DisplayTitle: "📋 Chuyển Lead",
            IconSymbol: "📋",
            Description: "Tự động nhận diện và bóc tách dữ liệu Lead",
            DisplayOrder: 2,
            ShowInHeaderNav: true,
            ShowInDashboardLaunchpad: true,
            HasBackgroundService: true,
            AssociatedFeatureId: "clipboard_monitor"
        ));

        RegisterRouteDescriptor(new AppRouteDescriptor(
            RouteId: AppRouteId.MessageCleaner,
            DisplayTitle: "🧹 Lọc Tin Nhắn",
            IconSymbol: "🧹",
            Description: "Lọc spam và chuẩn hóa văn bản tin nhắn",
            DisplayOrder: 3,
            ShowInHeaderNav: true,
            ShowInDashboardLaunchpad: true,
            HasBackgroundService: true,
            AssociatedFeatureId: "message_filter_pipeline"
        ));

        RegisterRouteDescriptor(new AppRouteDescriptor(
            RouteId: AppRouteId.Settings,
            DisplayTitle: "⚙️ Cài Đặt",
            IconSymbol: "⚙️",
            Description: "Cấu hình CTV, mã phòng và tùy chọn bộ lọc",
            DisplayOrder: 4,
            ShowInHeaderNav: true,
            ShowInDashboardLaunchpad: true,
            HasBackgroundService: false
        ));
    }

    private void RegisterRouteDescriptor(AppRouteDescriptor descriptor)
    {
        lock (_lock)
        {
            _routeTable[descriptor.RouteId] = descriptor;
        }
    }

    public void RegisterScreenFactory(AppRouteId routeId, Func<object> screenFactory)
    {
        lock (_lock)
        {
            _screenFactories[routeId] = screenFactory ?? throw new ArgumentNullException(nameof(screenFactory));
        }
    }

    public bool CanNavigate(AppRouteId routeId)
    {
        lock (_lock)
        {
            return _routeTable.ContainsKey(routeId) && _screenFactories.ContainsKey(routeId);
        }
    }

    public bool NavigateTo(AppRouteId routeId, object? parameter = null)
    {
        lock (_lock)
        {
            if (!CanNavigate(routeId))
            {
                _logger.LogWarning("Không thể điều hướng đến route {RouteId}: Route chưa được đăng ký Screen Factory", routeId);
                return false;
            }

            try
            {
                // Phân giải hoặc lấy màn hình từ bộ nhớ RAM
                _ = ResolveScreenInternal(routeId);
                CurrentRoute = routeId;
                _logger.LogInformation("Điều hướng thành công đến Route: {RouteId}", routeId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xảy ra khi khởi tạo màn hình cho Route: {RouteId}. Kích hoạt Dead-End Route Guard về Dashboard", routeId);
                if (routeId != AppRouteId.Dashboard && CanNavigate(AppRouteId.Dashboard))
                {
                    CurrentRoute = AppRouteId.Dashboard;
                }
                else
                {
                    return false;
                }
            }
        }

        Navigated?.Invoke(this, CurrentRoute);
        return true;
    }

    public bool NavigateHome()
    {
        return NavigateTo(AppRouteId.Dashboard);
    }

    public object? ResolveCurrentScreen()
    {
        lock (_lock)
        {
            return ResolveScreenInternal(CurrentRoute);
        }
    }

    private object? ResolveScreenInternal(AppRouteId routeId)
    {
        if (_screenInstances.TryGetValue(routeId, out var instance))
        {
            return instance;
        }

        if (_screenFactories.TryGetValue(routeId, out var factory))
        {
            var newInstance = factory();
            _screenInstances[routeId] = newInstance;
            return newInstance;
        }

        return null;
    }

    public AppRouteDescriptor? GetRouteDescriptor(AppRouteId routeId)
    {
        lock (_lock)
        {
            return _routeTable.TryGetValue(routeId, out var descriptor) ? descriptor : null;
        }
    }
}
