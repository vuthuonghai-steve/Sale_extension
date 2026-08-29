using AppForms.Backend.Adapters.Win32;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Shared.Models.MessageFilter;
using Microsoft.Extensions.Logging;

namespace AppForms.Backend.Services.MessageFilter;

/// <summary>
/// Service điều phối động cơ Pipeline lọc Clipboard tự động toàn hệ thống
/// </summary>
public class PipelineOrchestratorService : IFilterPipelineOrchestrator, IDisposable
{
    private readonly ILogger<PipelineOrchestratorService> _logger;
    private readonly ISettingsService _settingsService;
    private readonly ClipboardPipelineManager _pipelineManager;
    private readonly Win32ClipboardListener _listener;

    private FilterPipelineOptions _options;
    private string _lastProcessedText = string.Empty;
    private bool _disposed;

    public bool IsRunning { get; private set; }
    public FilterPipelineOptions CurrentOptions => _options;

    public event EventHandler<FilterExecutionReport>? PayloadProcessed;
    public event EventHandler<bool>? StateChanged;

    public PipelineOrchestratorService(
        ILogger<PipelineOrchestratorService> logger,
        ISettingsService settingsService,
        ClipboardPipelineManager pipelineManager,
        Win32ClipboardListener listener)
    {
        _logger = logger;
        _settingsService = settingsService;
        _pipelineManager = pipelineManager;
        _listener = listener;

        _options = _settingsService.Current.MessageFilterOptions ?? new FilterPipelineOptions();
        _pipelineManager.UpdateOptions(_options);

        _listener.ClipboardUpdated += OnClipboardUpdated;
        _settingsService.SettingsSaved += OnSettingsSaved;

        if (_options.EnableService)
        {
            Start();
        }
    }

    private void OnSettingsSaved(object? sender, EventArgs e)
    {
        var newOptions = _settingsService.Current.MessageFilterOptions ?? new FilterPipelineOptions();
        _options = newOptions;
        _pipelineManager.UpdateOptions(_options);

        _logger.LogInformation("🔄 [MESSAGE FILTER] Đã nạp cấu hình mới từ Settings. EnableService={Enable}", _options.EnableService);

        if (_options.EnableService && !IsRunning)
        {
            Start();
        }
        else if (!_options.EnableService && IsRunning)
        {
            Stop();
        }
    }

    public void Start()
    {
        if (IsRunning) return;
        IsRunning = true;
        _options.EnableService = true;
        _listener.Start("MessageFilter");
        StateChanged?.Invoke(this, true);
        _logger.LogInformation("🚀 [MESSAGE FILTER] Dịch vụ lọc OS Clipboard đã khởi động thành công.");

        if (_settingsService.Current.MessageFilterOptions?.EnableService != true)
        {
            _settingsService.Update(s => s.MessageFilterOptions.EnableService = true);
        }
    }

    public void Stop()
    {
        if (!IsRunning) return;
        IsRunning = false;
        _options.EnableService = false;
        _listener.Stop("MessageFilter");
        StateChanged?.Invoke(this, false);
        _logger.LogInformation("⏸️ [MESSAGE FILTER] Dịch vụ lọc OS Clipboard đã tạm dừng.");

        if (_settingsService.Current.MessageFilterOptions?.EnableService != false)
        {
            _settingsService.Update(s => s.MessageFilterOptions.EnableService = false);
        }
    }

    public void UpdateOptions(FilterPipelineOptions options)
    {
        _options = options;
        _pipelineManager.UpdateOptions(options);

        _settingsService.Update(s => s.MessageFilterOptions = options);

        if (!_options.EnableService && IsRunning)
        {
            Stop();
        }
        else if (_options.EnableService && !IsRunning)
        {
            Start();
        }
    }

    public FilterExecutionReport ProcessManual(string rawText)
    {
        return _pipelineManager.ProcessWithReport(rawText);
    }

    private void OnClipboardUpdated(object? sender, EventArgs e)
    {
        if (_disposed || !IsRunning || !_options.EnableService)
        {
            return;
        }

        try
        {
            string? rawText = Win32ClipboardAdapter.SafeReadClipboardText();

            if (string.IsNullOrEmpty(rawText) || string.Equals(rawText, _lastProcessedText, StringComparison.Ordinal))
            {
                return;
            }

            var report = _pipelineManager.ProcessWithReport(rawText);

            if (report.IsModified)
            {
                _lastProcessedText = report.CleanedText;
                bool success = Win32ClipboardAdapter.SafeWriteClipboardText(report.CleanedText);

                if (success)
                {
                    _logger.LogInformation(
                        "✨ [LỌC CLIPBOARD THÀNH CÔNG] Thô={RawLen} -> Sạch={CleanLen} | Thời gian={Elapsed}ms | Filters=[{Filters}]",
                        rawText.Length,
                        report.CleanedText.Length,
                        report.ElapsedMilliseconds,
                        string.Join(", ", report.AppliedFilters)
                    );
                }
                else
                {
                    _logger.LogWarning("⚠️ [CẢNH BÁO] Không thể ghi đè Clipboard do bị ứng dụng khác khóa quá lâu.");
                }
            }
            else
            {
                _lastProcessedText = rawText;
            }

            PayloadProcessed?.Invoke(this, report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "🔥 Lỗi trong quá trình lọc Clipboard tại PipelineOrchestratorService");
        }
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                _listener.ClipboardUpdated -= OnClipboardUpdated;
                _settingsService.SettingsSaved -= OnSettingsSaved;
                _listener.Stop("MessageFilter");
            }
            _disposed = true;
        }
    }
}
