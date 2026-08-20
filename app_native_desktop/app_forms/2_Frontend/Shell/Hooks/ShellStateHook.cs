using AppForms.Backend.Contracts.Interfaces;
using AppForms.Frontend.Shell.Models;
using AppForms.Shared.Constants;
using AppForms.Shared.Enums;
using Microsoft.Extensions.Logging;

namespace AppForms.Frontend.Shell.Hooks;

/// <summary>
/// Hook điều phối trạng thái và logic điều hướng của Shell Container (MainForm)
/// </summary>
public class ShellStateHook
{
    private readonly ILogger<ShellStateHook> _logger;
    private readonly INavigationService _navigationService;
    private readonly ISettingsService _settingsService;
    private readonly IFormConverterService _converterService;

    public ShellStateModel CurrentState { get; } = new();

    public event Action<ShellStateModel>? StateChanged;
    public event Action<object?>? ScreenResolved;
    public event Action<bool>? TopMostChanged;

    public bool MinimizeToTrayOnClose => _settingsService.Current.MinimizeToTrayOnClose;
    public bool AutoStartClipboardListening => _settingsService.Current.AutoStartClipboardListening;

    public ShellStateHook(
        ILogger<ShellStateHook> logger,
        INavigationService navigationService,
        ISettingsService settingsService,
        IFormConverterService converterService)
    {
        _logger = logger;
        _navigationService = navigationService;
        _settingsService = settingsService;
        _converterService = converterService;

        CurrentState.FixedCtvName = _settingsService.Current.FixedCtvName;
        CurrentState.IsClipboardListening = _converterService.IsClipboardListening;
        CurrentState.FooterStatus = $"Sẵn sàng | Sidepanel Assistant | v{AppConstants.AppVersion}";

        RegisterServiceEvents();
    }

    private void RegisterServiceEvents()
    {
        _navigationService.Navigated += (_, routeId) =>
        {
            CurrentState.CurrentRoute = routeId;

            if (routeId == AppRouteId.Dashboard)
            {
                CurrentState.RouteTitle = "⚡ SALE ASSISTANT";
            }
            else
            {
                var descriptor = _navigationService.GetRouteDescriptor(routeId);
                CurrentState.RouteTitle = descriptor?.DisplayTitle ?? "Màn hình";
            }

            var screenInstance = _navigationService.ResolveCurrentScreen();
            ScreenResolved?.Invoke(screenInstance);
            StateChanged?.Invoke(CurrentState);
        };

        _converterService.ClipboardListeningStateChanged += (_, isListening) =>
        {
            CurrentState.IsClipboardListening = isListening;
            StateChanged?.Invoke(CurrentState);
        };

        _settingsService.SettingsSaved += (_, _) =>
        {
            CurrentState.FixedCtvName = _settingsService.Current.FixedCtvName;
            CurrentState.FooterStatus = "Đã cập nhật cài đặt ứng dụng.";
            StateChanged?.Invoke(CurrentState);
        };
    }

    public void NavigateHome()
    {
        _navigationService.NavigateHome();
    }

    public void NavigateTo(AppRouteId routeId)
    {
        _navigationService.NavigateTo(routeId);
    }

    public void TogglePinTop()
    {
        CurrentState.IsPinnedTop = !CurrentState.IsPinnedTop;
        TopMostChanged?.Invoke(CurrentState.IsPinnedTop);
        StateChanged?.Invoke(CurrentState);
    }

    public void UpdateFooterStatus(string message)
    {
        CurrentState.FooterStatus = $"{message} | {DateTime.Now:HH:mm:ss}";
        StateChanged?.Invoke(CurrentState);
    }

    public void StartClipboardMonitor(IntPtr handle)
    {
        _converterService.StartClipboardMonitor(handle);
    }

    public void StopClipboardMonitor(IntPtr handle)
    {
        _converterService.StopClipboardMonitor(handle);
    }
}
