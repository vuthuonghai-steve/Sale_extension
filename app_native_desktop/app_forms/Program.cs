using AppForms.Backend.Adapters.Diagnostics;
using AppForms.Backend.Adapters.Win32;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Services;
using AppForms.Frontend.Forms;
using AppForms.Frontend.Tray;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
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

        // 2. Cấu hình Serilog Logger
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Debug()
            .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}")
            .CreateLogger();

        Log.Information(">>> Bắt đầu khởi động ứng dụng Sale Lead Form Converter <<<");

        // 3. Xử lý Unhandled Exception toàn cục
        Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
        Application.ThreadException += (_, e) =>
        {
            Log.Fatal(e.Exception, "Unhandled Thread Exception");
            MessageBox.Show($"Đã xảy ra lỗi không mong muốn:\n{e.Exception.Message}", "Lỗi Ứng Dụng", MessageBoxButtons.OK, MessageBoxIcon.Error);
        };
        AppDomain.CurrentDomain.UnhandledException += (_, e) =>
        {
            if (e.ExceptionObject is Exception ex)
            {
                Log.Fatal(ex, "Unhandled AppDomain Exception");
            }
        };

        // 4. Cấu hình WinForms Rendering
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        // 5. Cấu hình Dependency Injection (IoC Container)
        var services = new ServiceCollection();
        ConfigureServices(services);
        _serviceProvider = services.BuildServiceProvider();

        // 6. Chạy MainForm từ DI Container
        try
        {
            var mainForm = _serviceProvider.GetRequiredService<MainForm>();
            Application.Run(mainForm);
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "Lỗi xảy ra trong quá trình thực thi Application.Run");
        }
        finally
        {
            Log.Information("Ứng dụng đang tắt...");
            DebugConsole.Close();
            Log.CloseAndFlush();
        }
    }

    private static void ConfigureServices(IServiceCollection services)
    {
        // Logging
        services.AddLogging(builder =>
        {
            builder.ClearProviders();
            builder.AddSerilog(dispose: true);
        });

        // Backend Adapters
        services.AddSingleton<Win32ClipboardListener>();

        // Backend Core Services
        services.AddSingleton<ITextSanitizer, TextSanitizerService>();
        services.AddSingleton<IMessageParser, MessageParserService>();
        services.AddSingleton<ITemplateEngine, TemplateEngineService>();
        services.AddSingleton<ISchemaManager, SchemaManagerService>();
        services.AddSingleton<ISettingsService, SettingsService>();
        services.AddSingleton<ISchemaDetector, SchemaDetectorService>();
        services.AddSingleton<IFormConverterService, FormConverterService>();

        // Frontend Presentation & UI
        services.AddSingleton<TrayIconManager>();
        services.AddSingleton<MainForm>();
    }
}
