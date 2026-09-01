using AppForms.Backend.Contracts.Interfaces;
using AppForms.Shared.Common;
using AppForms.Shared.Models.Routing;
using Microsoft.Extensions.Logging;

namespace AppForms.Backend.Services.Routing;

/// <summary>
/// Dịch vụ kết nối và quản lý điều khiển tập trung các tính năng chạy ngầm trong hệ thống
/// </summary>
public class BackgroundFeatureRegistry : IBackgroundFeatureRegistry
{
    private readonly ILogger<BackgroundFeatureRegistry> _logger;
    private readonly IFormConverterService _converterService;
    private readonly IFilterPipelineOrchestrator _filterOrchestrator;
    private readonly IHotkeyManager _hotkeyManager;
    private readonly Dictionary<string, DateTime> _lastActivities = new();
    private readonly object _lock = new();

    public const string FeatureClipboardMonitor = "clipboard_monitor";
    public const string FeatureMessageFilter = "message_filter_pipeline";
    public const string FeatureHotkeyManager = "hotkey_manager";

    public event EventHandler<string>? FeatureStateChanged;

    public BackgroundFeatureRegistry(
        ILogger<BackgroundFeatureRegistry> logger,
        IFormConverterService converterService,
        IFilterPipelineOrchestrator filterOrchestrator,
        IHotkeyManager hotkeyManager)
    {
        _logger = logger;
        _converterService = converterService;
        _filterOrchestrator = filterOrchestrator;
        _hotkeyManager = hotkeyManager;

        SubscribeToServiceEvents();
    }


    private void SubscribeToServiceEvents()
    {
        _converterService.ClipboardListeningStateChanged += (_, isListening) =>
        {
            _logger.LogInformation("Trạng thái Clipboard Monitor đã đổi: {State}", isListening ? "BẬT" : "TẮT");
            OnFeatureStateChanged(FeatureClipboardMonitor);
        };

        _converterService.Converted += (_, _) =>
        {
            lock (_lock)
            {
                _lastActivities[FeatureClipboardMonitor] = DateTime.Now;
            }
            OnFeatureStateChanged(FeatureClipboardMonitor);
        };

        _filterOrchestrator.StateChanged += (_, isRunning) =>
        {
            _logger.LogInformation("Trạng thái Message Filter Pipeline đã đổi: {State}", isRunning ? "BẬT" : "TẮT");
            OnFeatureStateChanged(FeatureMessageFilter);
        };

        _filterOrchestrator.PayloadProcessed += (_, _) =>
        {
            lock (_lock)
            {
                _lastActivities[FeatureMessageFilter] = DateTime.Now;
            }
            OnFeatureStateChanged(FeatureMessageFilter);
        };

        _hotkeyManager.HotkeyTriggered += (_, _) =>
        {
            lock (_lock)
            {
                _lastActivities[FeatureHotkeyManager] = DateTime.Now;
            }
            OnFeatureStateChanged(FeatureHotkeyManager);
        };
    }

    private void OnFeatureStateChanged(string featureId)
    {
        FeatureStateChanged?.Invoke(this, featureId);
    }

    public IReadOnlyList<BackgroundFeatureStatus> GetAllFeatureStatuses()
    {
        lock (_lock)
        {
            _lastActivities.TryGetValue(FeatureClipboardMonitor, out var lastConv);
            _lastActivities.TryGetValue(FeatureMessageFilter, out var lastFilter);
            _lastActivities.TryGetValue(FeatureHotkeyManager, out var lastHotkey);

            return new List<BackgroundFeatureStatus>
            {
                new(
                    FeatureId: FeatureClipboardMonitor,
                    DisplayName: "Lắng Nghe Clipboard Bóc Tách Lead",
                    Description: "Tự động bắt và chuẩn hóa nội dung Lead khi sao chép",
                    IconSymbol: "📋",
                    IsRunning: _converterService.IsClipboardListening,
                    LastActivityTime: lastConv != default ? lastConv : null
                ),
                new(
                    FeatureId: FeatureMessageFilter,
                    DisplayName: "Pipeline Lọc Tin Nhắn Tự Động",
                    Description: "Tự động lọc spam, watermark và chuẩn hóa tin nhắn bất động sản",
                    IconSymbol: "🧹",
                    IsRunning: _filterOrchestrator.IsRunning,
                    LastActivityTime: lastFilter != default ? lastFilter : null
                ),
                new(
                    FeatureId: FeatureHotkeyManager,
                    DisplayName: "Hệ Thống Phím Tắt Toàn Cục",
                    Description: "Lắng nghe phím tắt và tự động chèn nhanh văn bản mẫu",
                    IconSymbol: "⌨️",
                    IsRunning: _hotkeyManager.IsGlobalListening,
                    LastActivityTime: lastHotkey != default ? lastHotkey : null
                )
            };
        }
    }

    public Result ToggleFeature(string featureId, bool enable, IntPtr windowHandle)
    {
        _logger.LogInformation("Yêu cầu chuyển đổi dịch vụ ngầm {FeatureId} -> {Enable}", featureId, enable ? "BẬT" : "TẮT");

        switch (featureId)
        {
            case FeatureClipboardMonitor:
                return enable
                    ? _converterService.StartClipboardMonitor(windowHandle)
                    : _converterService.StopClipboardMonitor(windowHandle);

            case FeatureMessageFilter:
                if (enable)
                {
                    _filterOrchestrator.Start();
                }
                else
                {
                    _filterOrchestrator.Stop();
                }
                return Result.Success();

            case FeatureHotkeyManager:
                _hotkeyManager.SetGlobalListening(enable);
                OnFeatureStateChanged(FeatureHotkeyManager);
                return Result.Success();

            default:
                _logger.LogWarning("Không tìm thấy dịch vụ ngầm với mã: {FeatureId}", featureId);
                return Result.Failure($"Không tìm thấy dịch vụ ngầm có mã định danh: {featureId}");
        }
    }

    public bool IsFeatureRunning(string featureId)
    {
        return featureId switch
        {
            FeatureClipboardMonitor => _converterService.IsClipboardListening,
            FeatureMessageFilter => _filterOrchestrator.IsRunning,
            FeatureHotkeyManager => _hotkeyManager.IsGlobalListening,
            _ => false
        };
    }
}

