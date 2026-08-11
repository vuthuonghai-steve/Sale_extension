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

        if (NativeMethods.AllocConsole())
        {
            _isConsoleAllocated = true;
            Console.Title = "AppForms - Debug Diagnostic Console";
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("=================================================");
            Console.WriteLine("  AppForms Debug Console Initialized (Win32 API) ");
            Console.WriteLine($"  Started at: {DateTime.Now:yyyy-MM-dd HH:mm:ss} ");
            Console.WriteLine("=================================================");
            Console.ResetColor();
        }
    }

    [Conditional("DEBUG")]
    public static void Close()
    {
        if (_isConsoleAllocated)
        {
            NativeMethods.FreeConsole();
            _isConsoleAllocated = false;
        }
    }
}
