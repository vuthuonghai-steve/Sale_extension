using System.Diagnostics;
using AppForms.Backend.Adapters.Win32;

namespace AppForms.Backend.Adapters.Diagnostics;

public static class DebugConsole
{
    private static bool _isConsoleAllocated;

    [Conditional("DEBUG")]
    public static void Open()
    {
        if (_isConsoleAllocated) return;

        // Chỉ mở Win32 Console nếu đang thực sự chạy trong môi trường Development
        if (!Infrastructure.LoggingConfiguration.IsDevelopmentEnvironment())
        {
            return;
        }

        if (NativeMethods.AllocConsole())
        {
            _isConsoleAllocated = true;
            try
            {
                Console.Title = "AppForms - [DEV MODE] Diagnostic Console";
            }
            catch
            {
                // Bỏ qua lỗi đặt tiêu đề console nếu không được hỗ trợ
            }
        }
    }

    [Conditional("DEBUG")]
    public static void Close()
    {
        if (_isConsoleAllocated)
        {
            try
            {
                NativeMethods.FreeConsole();
            }
            catch
            {
                // Bỏ qua lỗi giải phóng console
            }
            finally
            {
                _isConsoleAllocated = false;
            }
        }
    }
}
