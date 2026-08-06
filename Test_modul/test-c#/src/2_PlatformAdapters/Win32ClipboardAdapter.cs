using System.Runtime.InteropServices;
using System.Text;

namespace ClipboardFilterApp.PlatformAdapters;

/// <summary>
/// Platform Adapter giao tiếp trực tiếp với Win32 Native API của Windows OS
/// </summary>
public static class Win32ClipboardAdapter
{
    public const int WM_CLIPBOARDUPDATE = 0x031D;
    public const uint CF_UNICODETEXT = 13;

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool AllocConsole();

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool AddClipboardFormatListener(IntPtr hwnd);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool RemoveClipboardFormatListener(IntPtr hwnd);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool OpenClipboard(IntPtr hWndNewOwner);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool CloseClipboard();

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool EmptyClipboard();

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr GetClipboardData(uint uFormat);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr SetClipboardData(uint uFormat, IntPtr hMem);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern IntPtr GlobalAlloc(uint uFlags, UIntPtr dwBytes);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern IntPtr GlobalLock(IntPtr hMem);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool GlobalUnlock(IntPtr hMem);

    public const uint GMEM_MOVEABLE = 0x0002;
    public const uint GMEM_ZEROINIT = 0x0040;

    /// <summary>
    /// Đọc Unicode Văn bản an toàn từ Windows Clipboard
    /// </summary>
    public static string? SafeReadClipboardText()
    {
        if (!OpenClipboard(IntPtr.Zero)) return null;

        try
        {
            IntPtr hData = GetClipboardData(CF_UNICODETEXT);
            if (hData == IntPtr.Zero) return null;

            IntPtr pText = GlobalLock(hData);
            if (pText == IntPtr.Zero) return null;

            try
            {
                return Marshal.PtrToStringUni(pText);
            }
            finally
            {
                GlobalUnlock(hData);
            }
        }
        finally
        {
            CloseClipboard();
        }
    }

    /// <summary>
    /// Ghi văn bản sạch an toàn lên Windows Clipboard với Exponential Backoff Retry
    /// </summary>
    public static bool SafeWriteClipboardText(string text, int maxRetries = 5)
    {
        byte[] bytes = Encoding.Unicode.GetBytes(text + "\0");
        UIntPtr bytesSize = new UIntPtr((uint)bytes.Length);

        for (int i = 0; i < maxRetries; i++)
        {
            if (OpenClipboard(IntPtr.Zero))
            {
                try
                {
                    EmptyClipboard();

                    IntPtr hMem = GlobalAlloc(GMEM_MOVEABLE | GMEM_ZEROINIT, bytesSize);
                    if (hMem != IntPtr.Zero)
                    {
                        IntPtr pMem = GlobalLock(hMem);
                        if (pMem != IntPtr.Zero)
                        {
                            Marshal.Copy(bytes, 0, pMem, bytes.Length);
                            GlobalUnlock(hMem);

                            if (SetClipboardData(CF_UNICODETEXT, hMem) != IntPtr.Zero)
                            {
                                return true;
                            }
                        }
                    }
                }
                finally
                {
                    CloseClipboard();
                }
            }

            // Exponential Backoff Delay
            Thread.Sleep(5 * (1 << i));
        }

        return false;
    }
}
