using System.Diagnostics;
using AppForms.Backend.Contracts.Interfaces;
using Microsoft.Extensions.Logging;

namespace AppForms.Backend.Adapters.Win32;

/// <summary>
/// Triển khai ISystemLauncherAdapter cho môi trường Windows OS.
/// Sử dụng ProcessStartInfo với ShellExecute và áp dụng URL Sanitization Guard (FM-4).
/// </summary>
public class WindowsSystemLauncherAdapter : ISystemLauncherAdapter
{
    private readonly ILogger<WindowsSystemLauncherAdapter>? _logger;

    public WindowsSystemLauncherAdapter(ILogger<WindowsSystemLauncherAdapter>? logger = null)
    {
        _logger = logger;
    }

    public bool OpenBrowser(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return false;
        }

        // FM-4: URL Sanitization Guard - Chỉ chấp nhận Absolute URL với scheme HTTP/HTTPS
        if (!Uri.TryCreate(url.Trim(), UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            _logger?.LogWarning("Từ chối mở URL không hợp lệ hoặc không an toàn: {Url}", url);
            return false;
        }

        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = uri.AbsoluteUri,
                UseShellExecute = true
            });
            _logger?.LogInformation("Đã mở trình duyệt với URL: {Url}", uri.AbsoluteUri);
            return true;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Lỗi khi khởi chạy trình duyệt với URL: {Url}", url);
            return false;
        }
    }

    public string GetExecutablePath()
    {
        var processPath = Environment.ProcessPath;
        if (!string.IsNullOrWhiteSpace(processPath) && File.Exists(processPath))
        {
            return Path.GetFullPath(processPath);
        }

        var baseDir = AppDomain.CurrentDomain.BaseDirectory;
        var appFormsExe = Path.Combine(baseDir, "AppForms.exe");
        if (File.Exists(appFormsExe))
        {
            return Path.GetFullPath(appFormsExe);
        }

        return AppContext.BaseDirectory;
    }

    public bool OpenFolder(string folderPath)
    {
        if (string.IsNullOrWhiteSpace(folderPath) || !Directory.Exists(folderPath))
        {
            _logger?.LogWarning("Thư mục không tồn tại: {Path}", folderPath);
            return false;
        }

        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = Path.GetFullPath(folderPath),
                UseShellExecute = true
            });
            return true;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Lỗi khi mở thư mục: {Path}", folderPath);
            return false;
        }
    }
}
