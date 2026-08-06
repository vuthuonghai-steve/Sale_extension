using ClipboardFilterApp.Contracts;
using ClipboardFilterApp.Modules.CompositeModules;
using ClipboardFilterApp.PlatformAdapters;
using ClipboardFilterApp.PlatformAdapters.Logging;

namespace ClipboardFilterApp.Engine;

/// <summary>
/// Engine điều phối luồng lắng nghe - xử lý - ghi đè Clipboard toàn hệ thống
/// </summary>
public class PipelineOrchestrator
{
    private readonly FilterOptions _options;
    private readonly ClipboardPipelineManager _pipelineManager;
    private readonly NativeClipboardListener _listener;
    private string _lastProcessedText = string.Empty;

    public PipelineOrchestrator(FilterOptions options, ClipboardPipelineManager pipelineManager, NativeClipboardListener listener)
    {
        _options = options;
        _pipelineManager = pipelineManager;
        _listener = listener;
        _listener.ClipboardUpdated += OnClipboardUpdated;
        WindowsLoggerAdapter.LogInfo("PipelineOrchestrator đã sẵn sàng lắng nghe sự kiện Win32 Clipboard!");
    }

    private void OnClipboardUpdated(object? sender, EventArgs e)
    {
        // Nếu người dùng TẮT dịch vụ từ System Tray Menu -> Bỏ qua không lọc dữ liệu!
        if (!_options.EnableService)
        {
            return;
        }

        string? rawText = Win32ClipboardAdapter.SafeReadClipboardText();

        if (string.IsNullOrEmpty(rawText) || rawText == _lastProcessedText)
        {
            return;
        }

        string processedText = _pipelineManager.Process(rawText);

        if (processedText != rawText)
        {
            _lastProcessedText = processedText;
            bool success = Win32ClipboardAdapter.SafeWriteClipboardText(processedText);

            if (success)
            {
                WindowsLoggerAdapter.LogInfo($"[LỌC CLIPBOARD THÀNH CÔNG] Độ dài thô={rawText.Length} -> Độ dài sạch={processedText.Length} | Nội dung sạch: \"{processedText.Replace("\n", "\\n")}\"");
            }
            else
            {
                WindowsLoggerAdapter.LogWarning("[CẢNH BÁO] Không thể ghi đè Clipboard do bị ứng dụng khác Lock quá lâu!");
            }
        }
        else
        {
            _lastProcessedText = rawText;
        }
    }
}
