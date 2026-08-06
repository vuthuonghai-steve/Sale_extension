using System.Diagnostics;

namespace ClipboardFilterApp.PlatformAdapters.Logging;

/// <summary>
/// Platform Adapter ghi Log chuyên nghiệp cho Windows OS (Xuất Console, Debugger & File Log)
/// </summary>
public static class WindowsLoggerAdapter
{
    private static readonly string LogDirectory = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "logs");
    private static readonly object LockObj = new();

    static WindowsLoggerAdapter()
    {
        if (!Directory.Exists(LogDirectory))
        {
            Directory.CreateDirectory(LogDirectory);
        }
    }

    public static void LogInfo(string message)
    {
        WriteLog("INFO", message);
    }

    public static void LogWarning(string message)
    {
        WriteLog("WARN", message);
    }

    public static void LogError(string message, Exception? ex = null)
    {
        string fullMsg = ex != null ? $"{message} | Exception: {ex.Message}\n{ex.StackTrace}" : message;
        WriteLog("ERROR", fullMsg);
    }

    private static void WriteLog(string level, string message)
    {
        string timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff");
        string logLine = $"[{timestamp}] [{level}] {message}";

        // 1. In ra Debugger Stream (Soi được trên VS Code Output Window / Visual Studio)
        Debug.WriteLine(logLine);

        // 2. In ra Console Terminal (Nếu chạy bằng dotnet run hoặc bật Console)
        Console.WriteLine(logLine);

        // 3. Ghi vết persistent ra file logs/app-yyyy-MM-dd.log
        string fileName = $"app-{DateTime.Now:yyyy-MM-dd}.log";
        string filePath = Path.Combine(LogDirectory, fileName);

        lock (LockObj)
        {
            try
            {
                File.AppendAllText(filePath, logLine + Environment.NewLine);
            }
            catch
            {
                // Bỏ qua lỗi lock file log để không làm sập ứng dụng chính
            }
        }
    }
}
