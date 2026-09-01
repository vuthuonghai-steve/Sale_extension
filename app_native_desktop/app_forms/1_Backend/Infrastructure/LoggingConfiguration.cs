using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using Serilog;

namespace AppForms.Backend.Infrastructure;

/// <summary>
/// Quản lý cấu hình Serilog Multi-Sink theo tiêu chuẩn logging-best-practices.
/// Tự động bật Console & Debug Log ở môi trường phát triển (dotnet run),
/// và chuyển sang chế độ Silent/Error-only không hiển thị Console khi build đóng gói Release.
/// </summary>
public static class LoggingConfiguration
{
    /// <summary>
    /// Kiểm tra ứng dụng có nên hiển thị cửa sổ Console cho môi trường Dev hay không.
    /// Kích hoạt khi:
    /// 1. Chạy qua 'dotnet run' (nhận launch profile với APP_DEV_CONSOLE=true).
    /// 2. Truyền tham số dòng lệnh: --debug, --console, -v, --dev.
    /// 3. Debugger đang gắn vào tiến trình (Debugger.IsAttached).
    /// </summary>
    public static bool ShouldEnableConsole(string[]? args = null)
    {
        if (args != null && args.Any(a => 
            string.Equals(a, "--debug", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(a, "--console", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(a, "-v", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(a, "--dev", StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        var devConsole = Environment.GetEnvironmentVariable("APP_DEV_CONSOLE");
        if (string.Equals(devConsole, "true", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(devConsole, "1", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (Debugger.IsAttached)
        {
            return true;
        }

        return false;
    }

    /// <summary>
    /// Kiểm tra ứng dụng có đang chạy trong môi trường phát triển (Dev Mode) hay không.
    /// </summary>
    public static bool IsDevelopmentEnvironment(string[]? args = null)
    {
        if (ShouldEnableConsole(args))
        {
            return true;
        }

        var env = Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
               ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
               ?? Environment.GetEnvironmentVariable("APP_ENV");

        if (string.Equals(env, "Development", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(env, "Dev", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(env, "Debug", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
    }

    /// <summary>
    /// Khởi tạo cấu hình Logging phù hợp với từng môi trường thực thi.
    /// </summary>
    public static void Initialize(out string logDirectory, out string latestSessionPath, string[]? args = null)
    {
        var isDev = IsDevelopmentEnvironment(args);

        if (isDev)
        {
            InitializeDevelopmentLogging(out logDirectory, out latestSessionPath);
        }
        else
        {
            InitializeProductionLogging(out logDirectory, out latestSessionPath);
        }
    }

    /// <summary>
    /// Khởi tạo cấu hình Logging tương thích ngược (không truyền args).
    /// </summary>
    public static void Initialize(out string logDirectory, out string latestSessionPath)
        => Initialize(out logDirectory, out latestSessionPath, null);

    private static void InitializeDevelopmentLogging(out string logDirectory, out string latestSessionPath)
    {
        logDirectory = ResolveLogDirectory();
        var dailyLogPattern = Path.Combine(logDirectory, "app-.log");

        var sessionsDirectory = Path.Combine(logDirectory, "Sessions");
        Directory.CreateDirectory(sessionsDirectory);

        latestSessionPath = Path.Combine(sessionsDirectory, "session-latest.log");
        ArchivePreviousSessionLog(latestSessionPath, sessionsDirectory);

        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Debug()
            .Enrich.FromLogContext()
            .Enrich.WithProperty("Environment", "Development")
            .Enrich.WithProperty("MachineName", Environment.MachineName)
            .Enrich.WithProperty("ProcessId", Environment.ProcessId)
            .Enrich.WithProperty("DotNetRuntime", Environment.Version.ToString())
            // Sink 1: Realtime Console cho Dev Mode
            .WriteTo.Console(
                outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}")
            // Sink 2: Daily Rolling Log (Tổng hợp log theo ngày)
            .WriteTo.File(
                path: dailyLogPattern,
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 31,
                fileSizeLimitBytes: 10 * 1024 * 1024,
                rollOnFileSizeLimit: true,
                shared: true,
                flushToDiskInterval: TimeSpan.FromSeconds(1),
                outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} {Level:u3}] [{SourceContext}] {Message:lj} {@OperationContext}{NewLine}{Exception}")
            // Sink 3: Session Debug Log (Phiên chạy gần nhất)
            .WriteTo.File(
                path: latestSessionPath,
                rollingInterval: RollingInterval.Infinite,
                fileSizeLimitBytes: 10 * 1024 * 1024,
                shared: true,
                flushToDiskInterval: TimeSpan.FromSeconds(1),
                outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} {Level:u3}] [{SourceContext}] {Message:lj} {@OperationContext}{NewLine}{Exception}")
            .CreateLogger();

        Log.Information("🚀 [DEV MODE] Đã bật Serilog Multi-Sink Logging và Diagnostic Console");
        Log.Information("📁 Thư mục Logs: {LogDirectory}", logDirectory);
        Log.Information("📝 File Session Debug Log: {SessionLogFile}", latestSessionPath);
    }

    private static void InitializeProductionLogging(out string logDirectory, out string latestSessionPath)
    {
        latestSessionPath = string.Empty;
        logDirectory = ResolveProductionLogDirectory();

        var errorLogPattern = Path.Combine(logDirectory, "crash-.log");

        // Cấu hình Production: Hoàn toàn Silent, không mở Console, chỉ lưu Fatal/Error khi xảy ra sự cố nghiêm trọng
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Warning()
            .Enrich.FromLogContext()
            .Enrich.WithProperty("Environment", "Production")
            .Enrich.WithProperty("MachineName", Environment.MachineName)
            .Enrich.WithProperty("ProcessId", Environment.ProcessId)
            .WriteTo.File(
                path: errorLogPattern,
                rollingInterval: RollingInterval.Month,
                retainedFileCountLimit: 6,
                fileSizeLimitBytes: 5 * 1024 * 1024,
                rollOnFileSizeLimit: true,
                shared: true,
                outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} {Level:u3}] {Message:lj}{NewLine}{Exception}")
            .CreateLogger();
    }

    private static string ResolveLogDirectory()
    {
        try
        {
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

        var fallbackDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Logs");
        Directory.CreateDirectory(fallbackDir);
        return fallbackDir;
    }

    private static string ResolveProductionLogDirectory()
    {
        try
        {
            var appDataPath = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            var prodLogDir = Path.Combine(appDataPath, "SaleLeadFormConverter", "Logs");
            Directory.CreateDirectory(prodLogDir);
            return prodLogDir;
        }
        catch
        {
            var fallbackDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Logs");
            Directory.CreateDirectory(fallbackDir);
            return fallbackDir;
        }
    }

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

            var sessionFiles = new DirectoryInfo(sessionsDirectory)
                .GetFiles("session-*.log")
                .Where(f => !f.Name.Equals("session-latest.log", StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(f => f.LastWriteTimeUtc)
                .ToList();

            if (sessionFiles.Count > 30)
            {
                foreach (var oldFile in sessionFiles.Skip(30))
                {
                    try { oldFile.Delete(); } catch { /* Bỏ qua nếu đang bị khóa */ }
                }
            }
        }
        catch
        {
            // Bỏ qua lỗi IO nếu file cũ đang bị khóa
        }
    }
}
