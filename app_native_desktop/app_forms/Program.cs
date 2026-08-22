using System;
using System.Threading.Tasks;
using System.Windows.Forms;
using AppForms.Backend.Adapters.Diagnostics;
using AppForms.Backend.Infrastructure;
using AppForms.Backend.Shortcut;
using AppForms.Frontend.Infrastructure;
using AppForms.Frontend.Shell;
using Microsoft.Extensions.DependencyInjection;
using Serilog;

namespace AppForms;

internal static class Program
{
    private static IServiceProvider? _serviceProvider;

    [STAThread]
    private static void Main()
    {
        // 1. Khởi tạo Debug Console nếu ở chế độ DEBUG
        DebugConsole.Open();

        // 2. Cấu hình Serilog Multi-Sink Logging (Realtime Console + Daily Log + Session Log)
        LoggingConfiguration.Initialize(out var logDirectory, out _);

        // 3. Đăng ký bộ đón bắt ngoại lệ toàn cục chống Crash ứng dụng
        AppExceptionHandler.RegisterGlobalHandlers(logDirectory);

        // 4. Cấu hình WinForms Rendering
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        // 5. Khởi tạo IoC Container & Đăng ký Services (Phân tầng Backend & Frontend)
        var services = new ServiceCollection();
        services.AddBackendServices();
        services.AddFrontendServices();
        _serviceProvider = services.BuildServiceProvider();

        // 6. Kích hoạt tác vụ nền tự phục hồi Desktop Shortcut (Self-Healing, non-blocking)
        TriggerBackgroundStartupTasks(_serviceProvider);

        // 7. Chạy ứng dụng WinForms Shell chính từ DI Container
        try
        {
            var mainForm = _serviceProvider.GetRequiredService<MainForm>();
            Application.Run(mainForm);
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "🔥 [CRASH] Lỗi nghiêm trọng xảy ra trong quá trình thực thi Application.Run");
        }
        finally
        {
            Log.Information("Ứng dụng đã dừng hoàn tất.");
            DebugConsole.Close();
            Log.CloseAndFlush();
        }
    }

    private static void TriggerBackgroundStartupTasks(IServiceProvider serviceProvider)
    {
        try
        {
            var shortcutService = serviceProvider.GetRequiredService<IDesktopShortcutService>();
            var trayManager = serviceProvider.GetService<AppForms.Frontend.Tray.TrayIconManager>();
            Task.Run(async () =>
            {
                var result = shortcutService.EnsureShortcutSelfHeal();
                if (result.IsSuccess && result.IsCreatedOrUpdated && trayManager != null)
                {
                    await Task.Delay(1000);
                    trayManager.ShowNotification(
                        "Sale Lead Assistant",
                        "⚡ Đã tự động tạo lối tắt ứng dụng ngoài màn hình Desktop!",
                        ToolTipIcon.Info);
                }
            });
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "⚠️ Không thể kích hoạt tự động kiểm tra Shortcut tại startup");
        }
    }
}
