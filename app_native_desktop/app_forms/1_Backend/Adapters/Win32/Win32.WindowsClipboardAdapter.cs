using AppForms.Backend.Contracts.Interfaces;
using Microsoft.Extensions.Logging;

namespace AppForms.Backend.Adapters.Win32;

/// <summary>
/// Triển khai IClipboardAdapter tương tác với Windows OS Clipboard thông qua Native Win32 API.
/// Hoàn toàn độc lập với System.Windows.Forms.Clipboard, thread-safe và hỗ trợ exponential backoff retry.
/// </summary>
public class WindowsClipboardAdapter : IClipboardAdapter
{
    private readonly ILogger<WindowsClipboardAdapter>? _logger;

    public WindowsClipboardAdapter(ILogger<WindowsClipboardAdapter>? logger = null)
    {
        _logger = logger;
    }

    public bool SetText(string text)
    {
        if (text == null) return false;

        try
        {
            return Win32ClipboardAdapter.SafeWriteClipboardText(text);
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Lỗi khi ghi văn bản lên Windows Clipboard qua Win32 API");
            return false;
        }
    }

    public string? GetText()
    {
        try
        {
            return Win32ClipboardAdapter.SafeReadClipboardText();
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Lỗi khi đọc văn bản từ Windows Clipboard qua Win32 API");
            return null;
        }
    }

    public bool ContainsText()
    {
        try
        {
            var text = Win32ClipboardAdapter.SafeReadClipboardText();
            return !string.IsNullOrEmpty(text);
        }
        catch
        {
            return false;
        }
    }

    public bool Clear()
    {
        try
        {
            if (Win32ClipboardAdapter.OpenClipboard(IntPtr.Zero))
            {
                try
                {
                    return Win32ClipboardAdapter.EmptyClipboard();
                }
                finally
                {
                    Win32ClipboardAdapter.CloseClipboard();
                }
            }
            return false;
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Lỗi khi xóa dữ liệu Clipboard qua Win32 API");
            return false;
        }
    }
}
