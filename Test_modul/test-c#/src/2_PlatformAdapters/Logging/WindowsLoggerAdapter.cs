using System.Diagnostics;
using System.Threading.Channels;

namespace ClipboardFilterApp.PlatformAdapters.Logging;

/// <summary>
/// Platform Adapter ghi Log chuyên nghiệp cho Windows OS (Non-blocking STA Thread qua Channel, xuất Console, Debugger & File Log tại %LocalAppData%\ClipboardFilterApp\logs)
/// </summary>
public static class WindowsLoggerAdapter
{
    private static readonly string LogDirectory = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "ClipboardFilterApp",
        "logs"
    );

    private static readonly Channel<string> _logChannel = Channel.CreateUnbounded<string>(new UnboundedChannelOptions
    {
        SingleReader = true,
        SingleWriter = false
    });

    private static readonly Task _processingTask;

    static WindowsLoggerAdapter()
    {
        try
        {
            if (!Directory.Exists(LogDirectory))
            {
                Directory.CreateDirectory(LogDirectory);
            }
        }
        catch
        {
            // Bỏ qua lỗi nếu không thể tạo thư mục khởi tạo
        }

        _processingTask = Task.Run(ProcessLogsAsync);
    }

    public static void LogInfo(string message)
    {
        EnqueueLog("INFO", message);
    }

    public static void LogWarning(string message)
    {
        EnqueueLog("WARN", message);
    }

    public static void LogError(string message, Exception? ex = null)
    {
        string fullMsg = ex != null ? $"{message} | Exception: {ex.Message}\n{ex.StackTrace}" : message;
        EnqueueLog("ERROR", fullMsg);
    }

    private static void EnqueueLog(string level, string message)
    {
        string timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff");
        string logLine = $"[{timestamp}] [{level}] {message}";

        // 1. In ngay lập tức ra Debugger & Console cho lập trình viên theo dõi realtime
        Debug.WriteLine(logLine);
        Console.WriteLine(logLine);

        // 2. Đưa vào Channel phi đồng bộ (Non-blocking STA Thread) để Background Consumer ghi file
        _logChannel.Writer.TryWrite(logLine);
    }

    private static async Task ProcessLogsAsync()
    {
        try
        {
            while (await _logChannel.Reader.WaitToReadAsync())
            {
                while (_logChannel.Reader.TryRead(out var logLine))
                {
                    WriteToFile(logLine);
                }
            }
        }
        catch
        {
            // Bỏ qua lỗi vòng lặp để tránh crash background task
        }
    }

    private static void WriteToFile(string logLine)
    {
        try
        {
            if (!Directory.Exists(LogDirectory))
            {
                Directory.CreateDirectory(LogDirectory);
            }

            string fileName = $"app-{DateTime.Now:yyyy-MM-dd}.log";
            string filePath = Path.Combine(LogDirectory, fileName);

            File.AppendAllText(filePath, logLine + Environment.NewLine);
        }
        catch
        {
            // Bỏ qua lỗi lock file log để không làm sập ứng dụng chính
        }
    }

    /// <summary>
    /// Đóng Channel và chờ Background Worker hoàn tất việc flush toàn bộ log còn tồn đọng xuống đĩa
    /// </summary>
    public static void Shutdown()
    {
        try
        {
            _logChannel.Writer.Complete();
            _processingTask.Wait(TimeSpan.FromSeconds(2));
        }
        catch
        {
            // Bỏ qua ngoại lệ khi shutdown
        }
    }
}
