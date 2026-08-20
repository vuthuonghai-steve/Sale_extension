using AppForms.Backend.Contracts.Interfaces;
using AppForms.Shared.Models.MessageFilter;

namespace AppForms.Frontend.Screens.MessageFilter.Hooks;

/// <summary>
/// Hook quản lý toàn bộ trạng thái và hành động cho màn hình Lọc Tin Nhắn (MessageCleanerScreen)
/// </summary>
public class MessageCleanerStateHook : IDisposable
{
    private readonly IFilterPipelineOrchestrator _orchestrator;
    private readonly List<FilterExecutionReport> _history = new();
    private bool _disposed;

    public event Action<bool, FilterPipelineOptions>? StateUpdated;
    public event Action<FilterExecutionReport>? ReportReceived;
    public event Action<string, bool>? OperationFeedback;

    public MessageCleanerStateHook(IFilterPipelineOrchestrator orchestrator)
    {
        _orchestrator = orchestrator;
        _orchestrator.PayloadProcessed += OnPayloadProcessed;
        _orchestrator.StateChanged += OnStateChanged;
    }

    public void LoadInitialState()
    {
        StateUpdated?.Invoke(_orchestrator.IsRunning, _orchestrator.CurrentOptions);
    }

    public void ToggleService(bool enable)
    {
        var options = _orchestrator.CurrentOptions;
        options.EnableService = enable;
        _orchestrator.UpdateOptions(options);

        OperationFeedback?.Invoke(
            enable ? "Đã bật dịch vụ lọc OS Clipboard (Ctrl+C)" : "Đã tạm dừng lọc OS Clipboard",
            enable
        );
    }

    public void UpdateOptions(FilterPipelineOptions options)
    {
        _orchestrator.UpdateOptions(options);
        OperationFeedback?.Invoke("Đã cập nhật các quy tắc lọc.", true);
    }

    public void ProcessManual(string rawText)
    {
        if (string.IsNullOrEmpty(rawText))
        {
            var emptyReport = new FilterExecutionReport(string.Empty, string.Empty, DateTime.Now, false, 0, Array.Empty<string>());
            ReportReceived?.Invoke(emptyReport);
            return;
        }

        var report = _orchestrator.ProcessManual(rawText);
        lock (_history)
        {
            _history.Insert(0, report);
            if (_history.Count > 100) _history.RemoveAt(_history.Count - 1);
        }

        ReportReceived?.Invoke(report);
    }

    public void CopyToClipboard(string text)
    {
        if (string.IsNullOrEmpty(text)) return;

        try
        {
            bool success = AppForms.Backend.Adapters.Win32.Win32ClipboardAdapter.SafeWriteClipboardText(text);
            if (success)
            {
                OperationFeedback?.Invoke("Đã sao chép nội dung sạch vào Clipboard!", true);
            }
            else
            {
                OperationFeedback?.Invoke("Không thể ghi vào Clipboard (đang bị ứng dụng khác khóa).", false);
            }
        }
        catch (Exception ex)
        {
            OperationFeedback?.Invoke($"Lỗi khi sao chép: {ex.Message}", false);
        }
    }

    private void OnPayloadProcessed(object? sender, FilterExecutionReport report)
    {
        lock (_history)
        {
            _history.Insert(0, report);
            if (_history.Count > 100) _history.RemoveAt(_history.Count - 1);
        }

        ReportReceived?.Invoke(report);
    }

    private void OnStateChanged(object? sender, bool isRunning)
    {
        StateUpdated?.Invoke(isRunning, _orchestrator.CurrentOptions);
    }

    public void Dispose()
    {
        if (!_disposed)
        {
            _orchestrator.PayloadProcessed -= OnPayloadProcessed;
            _orchestrator.StateChanged -= OnStateChanged;
            _disposed = true;
        }
    }
}
