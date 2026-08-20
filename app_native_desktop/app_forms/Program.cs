using AppForms.Backend.Adapters.Diagnostics;
using AppForms.Backend.Adapters.Win32;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Services;
using AppForms.Frontend.Shell;
using AppForms.Frontend.Shell.Hooks;
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

        // 2. Xác định đường dẫn thư mục Logs và Sessions
        var logDirectory = ResolveLogDirectory();
        var dailyLogPattern = Path.Combine(logDirectory, "app-.log");

        var sessionsDirectory = Path.Combine(logDirectory, "Sessions");
        Directory.CreateDirectory(sessionsDirectory);

        // Quản lý file session: Tự động lưu trữ session cũ và tạo file session-latest.log mới
        var latestSessionPath = Path.Combine(sessionsDirectory, "session-latest.log");
        ArchivePreviousSessionLog(latestSessionPath, sessionsDirectory);

        // 3. Cấu hình Serilog Logger (Đa tầng: Console real-time + Daily Log + Session Log mới nhất)
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Debug()
            .Enrich.FromLogContext()
            .WriteTo.Console(
                outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}")
            // 3.1. Daily Rolling Log (Tổng hợp log theo ngày)
            .WriteTo.File(
                path: dailyLogPattern,
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 31,
                fileSizeLimitBytes: 10 * 1024 * 1024,
                rollOnFileSizeLimit: true,
                shared: true,
                flushToDiskInterval: TimeSpan.FromSeconds(1),
                outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} {Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}")
            // 3.2. Session Debug Log (Luôn là session mới nhất: Logs/Sessions/session-latest.log)
            .WriteTo.File(
                path: latestSessionPath,
                rollingInterval: RollingInterval.Infinite,
                fileSizeLimitBytes: 10 * 1024 * 1024,
                shared: true,
                flushToDiskInterval: TimeSpan.FromSeconds(1),
                outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} {Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}")
            .CreateLogger();

        Log.Information(">>> Bắt đầu khởi động ứng dụng Sale Lead Form Converter <<<");
        Log.Information("📁 Thư mục Logs: {LogDirectory}", logDirectory);
        Log.Information("📝 File Session Debug Log (Mới nhất): {SessionLogFile}", latestSessionPath);

        // 4. Xử lý Unhandled Exception toàn cục chống mất log khi app crash
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

        TaskScheduler.UnobservedTaskException += (_, e) =>
        {
            Log.Error(e.Exception, "⚠️ Unobserved Task Exception trong Background Task");
            e.SetObserved();
            Log.CloseAndFlush();
        };

        AppDomain.CurrentDomain.ProcessExit += (_, _) =>
        {
            Log.Information("Ứng dụng đang thoát (ProcessExit)...");
            Log.CloseAndFlush();
        };

        // 5. Cấu hình WinForms Rendering
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        // 6. Cấu hình Dependency Injection (IoC Container)
        var services = new ServiceCollection();
        ConfigureServices(services);
        _serviceProvider = services.BuildServiceProvider();

        // 7. Chạy MainForm từ DI Container
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
        services.AddSingleton<JsonRoomCodeRepository>();
        services.AddSingleton<IRoomCodeRepository>(sp => sp.GetRequiredService<JsonRoomCodeRepository>());
        services.AddSingleton<IRoomCodeReadOnlyRepository>(sp => sp.GetRequiredService<JsonRoomCodeRepository>());
        services.AddSingleton<ISchemaDetector, SchemaDetectorService>();
        services.AddSingleton<IFormConverterService, FormConverterService>();

        // Message Regex Filter Pipeline Sub-modules
        services.AddSingleton<IClipboardFilter, AppForms.Backend.Services.MessageFilter.SubFilters.UnicodeSanitizerFilter>();
        services.AddSingleton<IClipboardFilter, AppForms.Backend.Services.MessageFilter.SubFilters.ReplyQuoteFilter>();
        services.AddSingleton<IClipboardFilter, AppForms.Backend.Services.MessageFilter.SubFilters.ZaloStickerFilter>();
        services.AddSingleton<IClipboardFilter, AppForms.Backend.Services.MessageFilter.SubFilters.BrandRegexFilter>();
        services.AddSingleton<IClipboardFilter, AppForms.Backend.Services.MessageFilter.SubFilters.CommissionRegexFilter>();
        services.AddSingleton<IClipboardFilter, AppForms.Backend.Services.MessageFilter.SubFilters.UrlSanitizerFilter>();

        // Message Regex Filter Pipeline Manager & Orchestrator
        services.AddSingleton<AppForms.Backend.Services.MessageFilter.ClipboardPipelineManager>(sp =>
        {
            var settingsService = sp.GetRequiredService<ISettingsService>();
            var filters = sp.GetServices<IClipboardFilter>();
            var options = settingsService.Current.MessageFilterOptions ?? new AppForms.Shared.Models.MessageFilter.FilterPipelineOptions();
            return new AppForms.Backend.Services.MessageFilter.ClipboardPipelineManager(options, filters);
        });
        services.AddSingleton<IFilterPipelineOrchestrator, AppForms.Backend.Services.MessageFilter.PipelineOrchestratorService>();

        // Routing & Background Services
        services.AddSingleton<INavigationService, AppForms.Backend.Services.Routing.NavigationService>();
        services.AddSingleton<IBackgroundFeatureRegistry, AppForms.Backend.Services.Routing.BackgroundFeatureRegistry>();

        // Frontend Screens (Singletons để duy trì state trong RAM)
        services.AddSingleton<AppForms.Frontend.Screens.Dashboard.DashboardScreen>();
        services.AddSingleton<AppForms.Frontend.Screens.LeadConverter.LeadConverterScreen>();
        services.AddSingleton<AppForms.Frontend.Screens.MessageFilter.MessageCleanerScreen>();
        services.AddSingleton<AppForms.Frontend.Screens.Settings.SettingsScreen>();

        // Frontend Presentation & UI
        services.AddSingleton<TrayIconManager>();
        services.AddSingleton<ShellStateHook>();
        services.AddSingleton<MainForm>(sp =>
        {
            var navService = sp.GetRequiredService<INavigationService>();

            // Đăng ký Screen Factories cho Navigation Router
            navService.RegisterScreenFactory(AppForms.Shared.Enums.AppRouteId.Dashboard, () => sp.GetRequiredService<AppForms.Frontend.Screens.Dashboard.DashboardScreen>());
            navService.RegisterScreenFactory(AppForms.Shared.Enums.AppRouteId.LeadConverter, () => sp.GetRequiredService<AppForms.Frontend.Screens.LeadConverter.LeadConverterScreen>());
            navService.RegisterScreenFactory(AppForms.Shared.Enums.AppRouteId.MessageCleaner, () => sp.GetRequiredService<AppForms.Frontend.Screens.MessageFilter.MessageCleanerScreen>());
            navService.RegisterScreenFactory(AppForms.Shared.Enums.AppRouteId.Settings, () => sp.GetRequiredService<AppForms.Frontend.Screens.Settings.SettingsScreen>());

            return new MainForm(
                sp.GetRequiredService<ILogger<MainForm>>(),
                sp.GetRequiredService<ShellStateHook>(),
                sp.GetRequiredService<TrayIconManager>()
            );
        });
    }

    /// <summary>
    /// Tự động xác định đường dẫn thư mục Logs (ưu tiên thư mục Logs trong workspace khi debug hoặc BaseDirectory khi chạy độc lập)
    /// </summary>
    private static string ResolveLogDirectory()
    {
        try
        {
            // 1. Kiểm tra nếu đang chạy trong môi trường dev (từ bin/Debug/net6.0-windows/win-x64/...)
            var candidateProjectRoot4 = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", ".."));
            if (File.Exists(Path.Combine(candidateProjectRoot4, "AppForms.csproj")))
            {
                var candidateLogs4 = Path.Combine(candidateProjectRoot4, "Logs");
                Directory.CreateDirectory(candidateLogs4);
                return candidateLogs4;
            }

            var candidateProjectRoot3 = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", ".."));
            if (File.Exists(Path.Combine(candidateProjectRoot3, "AppForms.csproj")))
            {
                var candidateLogs3 = Path.Combine(candidateProjectRoot3, "Logs");
                Directory.CreateDirectory(candidateLogs3);
                return candidateLogs3;
            }
        }
        catch
        {
            // Bỏ qua nếu có lỗi IO khi dò thư mục cha
        }

        // 2. Mặc định dùng thư mục Logs ngay tại BaseDirectory
        var fallbackDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Logs");
        Directory.CreateDirectory(fallbackDir);
        return fallbackDir;
    }

    /// <summary>
    /// Lưu trữ file session-latest.log của lần chạy trước thành session-yyyyMMdd-HHmmss.log,
    /// đồng thời tự động dọn dẹp giữ lại tối đa 30 phiên debug gần nhất.
    /// </summary>
    private static void ArchivePreviousSessionLog(string latestSessionPath, string sessionsDirectory)
    {
        try
        {
            if (File.Exists(latestSessionPath))
            {
                var lastWriteTime = File.GetLastWriteTime(latestSessionPath);
                var archiveFileName = $"session-{lastWriteTime:yyyyMMdd-HHmmss}.log";
                var archivePath = Path.Combine(sessionsDirectory, archiveFileName);

                if (File.Exists(archivePath))
                {
                    archivePath = Path.Combine(sessionsDirectory, $"session-{lastWriteTime:yyyyMMdd-HHmmssfff}.log");
                }

                File.Move(latestSessionPath, archivePath, overwrite: true);
            }

            // Dọn dẹp: giữ lại tối đa 30 session lịch sử gần nhất
            var sessionFiles = new DirectoryInfo(sessionsDirectory)
                .GetFiles("session-*.log")
                .Where(f => !f.Name.Equals("session-latest.log", StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(f => f.LastWriteTimeUtc)
                .ToList();

            if (sessionFiles.Count > 30)
            {
                foreach (var oldFile in sessionFiles.Skip(30))
                {
                    try { oldFile.Delete(); } catch { /* Bỏ qua nếu đang bị lock */ }
                }
            }
        }
        catch
        {
            // Bỏ qua lỗi IO nếu file cũ đang bị trình xem khác khóa
        }
    }
}

