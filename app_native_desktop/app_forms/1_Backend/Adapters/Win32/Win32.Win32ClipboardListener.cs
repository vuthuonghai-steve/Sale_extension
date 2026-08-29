using AppForms.Backend.Adapters.Win32;
using AppForms.Shared.Constants;
using Microsoft.Extensions.Logging;

namespace AppForms.Backend.Adapters.Win32;

/// <summary>
/// NativeWindow ẩn chuyên lắng nghe message WM_CLIPBOARDUPDATE từ Windows Message Pump với cơ chế Multi-Consumer Ref Counting
/// </summary>
public class Win32ClipboardListener : NativeWindow, IDisposable
{
    private readonly ILogger<Win32ClipboardListener> _logger;
    private readonly HashSet<string> _activeConsumers = new(StringComparer.OrdinalIgnoreCase);
    private readonly object _lock = new();
    private bool _isListening;

    public event EventHandler? ClipboardUpdated;

    public bool IsListening
    {
        get
        {
            lock (_lock)
            {
                return _isListening;
            }
        }
    }

    public IReadOnlyCollection<string> ActiveConsumers
    {
        get
        {
            lock (_lock)
            {
                return _activeConsumers.ToList();
            }
        }
    }

    public Win32ClipboardListener(ILogger<Win32ClipboardListener> logger)
    {
        _logger = logger;
        CreateHandle(new CreateParams
        {
            Caption = "AppForms_ClipboardListener_HiddenWindow",
            Style = 0
        });
    }

    public bool Start(string consumerId = "default")
    {
        lock (_lock)
        {
            _activeConsumers.Add(consumerId);
            _logger.LogInformation("Win32 Clipboard Listener: Consumer '{ConsumerId}' registered. Active count: {Count}", consumerId, _activeConsumers.Count);

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
    }

    public void Stop(string consumerId = "default")
    {
        lock (_lock)
        {
            if (_activeConsumers.Remove(consumerId))
            {
                _logger.LogInformation("Win32 Clipboard Listener: Consumer '{ConsumerId}' unregistered. Active count: {Count}", consumerId, _activeConsumers.Count);
            }

            if (_activeConsumers.Count == 0 && _isListening)
            {
                if (Handle != IntPtr.Zero)
                {
                    NativeMethods.RemoveClipboardFormatListener(Handle);
                    _isListening = false;
                    _logger.LogInformation("Win32 Clipboard Listener stopped on HWND: {Handle} (No active consumers)", Handle);
                }
            }
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
        lock (_lock)
        {
            _activeConsumers.Clear();
            if (_isListening && Handle != IntPtr.Zero)
            {
                NativeMethods.RemoveClipboardFormatListener(Handle);
                _isListening = false;
            }
        }
        DestroyHandle();
        GC.SuppressFinalize(this);
    }
}
