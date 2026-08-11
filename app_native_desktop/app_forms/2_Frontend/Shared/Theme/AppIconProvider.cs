using System.Drawing;

namespace AppForms.Frontend.Shared.Theme;

/// <summary>
/// Cung cấp Icon chuẩn của ứng dụng cho MainForm, Dialogs và Tray NotifyIcon.
/// </summary>
public static class AppIconProvider
{
    private static Icon? _cachedIcon;

    /// <summary>
    /// Lấy Icon chính của ứng dụng.
    /// Tự động nạp từ thư mục Assets, Extract từ Executable hoặc fallback an toàn.
    /// </summary>
    public static Icon GetAppIcon()
    {
        if (_cachedIcon != null)
        {
            return _cachedIcon;
        }

        try
        {
            // 1. Tìm trong thư mục Assets tương đối với BaseDirectory hoặc CurrentDirectory
            var possiblePaths = new[]
            {
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Assets", "app_icon.ico"),
                Path.Combine(Directory.GetCurrentDirectory(), "Assets", "app_icon.ico"),
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "Assets", "app_icon.ico")
            };

            foreach (var path in possiblePaths)
            {
                if (File.Exists(path))
                {
                    _cachedIcon = new Icon(path);
                    return _cachedIcon;
                }
            }

            // 2. Thử extract từ file thực thi chính của ứng dụng
            var exePath = Application.ExecutablePath;
            if (!string.IsNullOrEmpty(exePath) && File.Exists(exePath))
            {
                var extracted = Icon.ExtractAssociatedIcon(exePath);
                if (extracted != null)
                {
                    _cachedIcon = extracted;
                    return _cachedIcon;
                }
            }
        }
        catch
        {
            // Bỏ qua lỗi và chuyển sang fallback
        }

        // 3. Fallback mặc định
        _cachedIcon = SystemIcons.Application;
        return _cachedIcon;
    }
}
