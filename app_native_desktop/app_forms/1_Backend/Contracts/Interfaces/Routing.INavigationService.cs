using AppForms.Shared.Enums;
using AppForms.Shared.Models.Routing;

namespace AppForms.Backend.Contracts.Interfaces;

/// <summary>
/// Hợp đồng điều phối điều hướng tuyến và phân giải màn hình
/// </summary>
public interface INavigationService
{
    /// <summary>
    /// Định danh Route đang kích hoạt trên giao diện
    /// </summary>
    AppRouteId CurrentRoute { get; }

    /// <summary>
    /// Danh sách tất cả các Route đã được đăng ký trong hệ thống
    /// </summary>
    IReadOnlyList<AppRouteDescriptor> RegisteredRoutes { get; }

    /// <summary>
    /// Bắn ra khi điều hướng thành công sang màn hình mới
    /// </summary>
    event EventHandler<AppRouteId>? Navigated;

    /// <summary>
    /// Kích hoạt chuyển trang đến Route đích
    /// </summary>
    bool NavigateTo(AppRouteId routeId, object? parameter = null);

    /// <summary>
    /// Điều hướng nhanh về màn hình Dashboard trung tâm
    /// </summary>
    bool NavigateHome();

    /// <summary>
    /// Kiểm tra tính khả dụng của Route
    /// </summary>
    bool CanNavigate(AppRouteId routeId);

    /// <summary>
    /// Đăng ký hàm Factory khởi tạo hoặc lấy instance màn hình
    /// </summary>
    void RegisterScreenFactory(AppRouteId routeId, Func<object> screenFactory);

    /// <summary>
    /// Phân giải instance màn hình ứng với CurrentRoute hiện tại
    /// </summary>
    object? ResolveCurrentScreen();

    /// <summary>
    /// Lấy metadata cấu hình của một Route cụ thể
    /// </summary>
    AppRouteDescriptor? GetRouteDescriptor(AppRouteId routeId);
}
