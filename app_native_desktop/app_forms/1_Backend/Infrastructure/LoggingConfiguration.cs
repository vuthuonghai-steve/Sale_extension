using System;
using System.IO;
using System.Linq;
using Serilog;

namespace AppForms.Backend.Infrastructure;

/// <summary>
/// Quản lý cấu hình Serilog Multi-Sink, định tuyến thư mục log và lưu trữ session log.
/// Không phụ thuộc vào WinForms UI.
/// </summary>
public static class LoggingConfiguration
{
    public static void Initialize(out string logDirectory, out string latestSessionPath)
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
            .Enrich.WithProperty("MachineName", Environment.MachineName)
            .Enrich.WithProperty("ProcessId", Environment.ProcessId)
            .Enrich.WithProperty("DotNetRuntime", Environment.Version.ToString())
            // Sink 1: Realtime Console
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

        Log.Information(">>> Khởi động Serilog Multi-Sink Logging thành công <<<");
        Log.Information("📁 Thư mục Logs: {LogDirectory}", logDirectory);
        Log.Information("📝 File Session Debug Log: {SessionLogFile}", latestSessionPath);
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
