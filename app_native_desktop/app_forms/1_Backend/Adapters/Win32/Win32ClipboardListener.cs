using AppForms.Backend.Adapters.Win32;
using AppForms.Shared.Constants;
using Microsoft.Extensions.Logging;

namespace AppForms.Backend.Adapters.Win32;

/// <summary>
/// NativeWindow ẩn chuyên lắng nghe message WM_CLIPBOARDUPDATE từ Windows Message Pump
/// </summary>
public class Win32ClipboardListener : NativeWindow, IDisposable
{
    private readonly ILogger<Win32ClipboardListener> _logger;
    private bool _isListening;

    public event EventHandler? ClipboardUpdated;

    public Win32ClipboardListener(ILogger<Win32ClipboardListener> logger)
    {
        _logger = logger;
        CreateHandle(new CreateParams
        {
            Caption = "AppForms_ClipboardListener_HiddenWindow",
            Style = 0
        });
    }

    public bool Start()
    {
        if (_isListening) return true;

        if (Handle != IntPtr.Zero)
        {
            _isListening = NativeMethods.AddClipboardFormatListener(Handle);
            if (_isListening)
            {
                _logger.LogInformation("Win32 Clipboard Listener started on HWND: {Handle}", Handle);
            }
            else
            {
                _logger.LogError("Failed to attach AddClipboardFormatListener on HWND: {Handle}", Handle);
            }
        }
        return _isListening;
    }

    public void Stop()
    {
        if (!_isListening) return;

        if (Handle != IntPtr.Zero)
        {
            NativeMethods.RemoveClipboardFormatListener(Handle);
            _isListening = false;
            _logger.LogInformation("Win32 Clipboard Listener stopped on HWND: {Handle}", Handle);
        }
    }

    protected override void WndProc(ref Message m)
    {
        if (m.Msg == AppConstants.Win32Messages.WM_CLIPBOARDUPDATE)
        {
            ClipboardUpdated?.Invoke(this, EventArgs.Empty);
        }
        base.WndProc(ref m);
    }

    public void Dispose()
    {
        Stop();
        DestroyHandle();
        GC.SuppressFinalize(this);
    }
}
