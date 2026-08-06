using ClipboardFilterApp.PlatformAdapters;

namespace ClipboardFilterApp.Engine;

/// <summary>
/// Native Win32 Invisible Window Listener lắng nghe sự kiện WM_CLIPBOARDUPDATE từ Windows OS
/// </summary>
public class NativeClipboardListener : NativeWindow, IDisposable
{
    public event EventHandler? ClipboardUpdated;

    public NativeClipboardListener()
    {
        CreateParams cp = new CreateParams
        {
            Caption = "Win32ClipboardListenerWindow",
            Parent = IntPtr.Zero
        };

        CreateHandle(cp);
        Win32ClipboardAdapter.AddClipboardFormatListener(Handle);
    }

    protected override void WndProc(ref Message m)
    {
        if (m.Msg == Win32ClipboardAdapter.WM_CLIPBOARDUPDATE)
        {
            ClipboardUpdated?.Invoke(this, EventArgs.Empty);
        }

        base.WndProc(ref m);
    }

    public void Dispose()
    {
        Win32ClipboardAdapter.RemoveClipboardFormatListener(Handle);
        DestroyHandle();
        GC.SuppressFinalize(this);
    }
}
