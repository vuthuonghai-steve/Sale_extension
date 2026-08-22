using System;
using System.Threading.Tasks;
using System.Windows.Forms;
using Serilog;

namespace AppForms.Frontend.Infrastructure;

/// <summary>
/// Quản lý đón bắt Exception toàn cục cho giao diện WinForms và tiến trình Desktop.
/// </summary>
public static class AppExceptionHandler
{
    public static void RegisterGlobalHandlers(string logDirectory)
    {
        // 1. Xử lý Unhandled Exception toàn cục cho UI Thread
        Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
        
        Application.ThreadException += (_, e) =>
        {
            Log.Fatal(e.Exception, "🔥 [CRASH] Unhandled UI Thread Exception");
            Log.CloseAndFlush();
            MessageBox.Show(
                $"Đã xảy ra lỗi không mong muốn:\n{e.Exception.Message}\n\nChi tiết log lỗi đã được lưu tại:\n{logDirectory}",
                "Lỗi Ứng Dụng (Thread Crash)",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        };

        // 2. Bắt lỗi ngoài luồng UI (AppDomain)
        AppDomain.CurrentDomain.UnhandledException += (_, e) =>
        {
            if (e.ExceptionObject is Exception ex)
            {
                Log.Fatal(ex, "🔥 [CRASH] Unhandled AppDomain Exception (IsTerminating: {IsTerminating})", e.IsTerminating);
            }
            else
            {
                Log.Fatal("🔥 [CRASH] Unhandled AppDomain Exception (Object: {ExceptionObject}, IsTerminating: {IsTerminating})", e.ExceptionObject, e.IsTerminating);
            }
            Log.CloseAndFlush();
        };

        // 3. Bắt lỗi trong Background Tasks chưa được observe
        TaskScheduler.UnobservedTaskException += (_, e) =>
        {
            Log.Error(e.Exception, "⚠️ Unobserved Task Exception trong Background Task");
            e.SetObserved();
            Log.CloseAndFlush();
        };

        // 4. Đảm bảo flush log khi thoát tiến trình
        AppDomain.CurrentDomain.ProcessExit += (_, _) =>
        {
            Log.Information("Ứng dụng đang thoát (ProcessExit)...");
            Log.CloseAndFlush();
        };
    }
}
