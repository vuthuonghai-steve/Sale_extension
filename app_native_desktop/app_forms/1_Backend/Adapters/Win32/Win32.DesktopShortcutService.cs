using AppForms.Backend.Contracts.Interfaces;
using AppForms.Shared.Models.Shortcut;
using Microsoft.Extensions.Logging;

namespace AppForms.Backend.Adapters.Win32;

/// <summary>
/// Triển khai IDesktopShortcutService cho Windows OS sử dụng WScript.Shell COM Object.
/// Đảm bảo tính toán đường dẫn thực thi an toàn qua Environment.ProcessPath, hoàn toàn không phụ thuộc WinForms UI Application.
/// </summary>
public class DesktopShortcutService : IDesktopShortcutService
{
    private readonly ILogger<DesktopShortcutService> _logger;
    private readonly ISystemLauncherAdapter? _launcherAdapter;
    private const string AppShortcutName = "Sale Lead Assistant.lnk";
    private const string ShortcutDescription = "Trợ lý Sidepanel Desktop tự động chuyển đổi Lead Form";

    public DesktopShortcutService(
        ILogger<DesktopShortcutService> logger,
        ISystemLauncherAdapter? launcherAdapter = null)
    {
        _logger = logger;
        _launcherAdapter = launcherAdapter;
    }

    public ShortcutResult EnsureShortcutSelfHeal()
    {
        try
        {
            string desktopDir = ResolveDesktopPath(null);
            string shortcutPath = Path.Combine(desktopDir, AppShortcutName);
            string currentExePath = GetCurrentExecutablePath();

            if (File.Exists(shortcutPath))
            {
                string existingTarget = ReadShortcutTargetPath(shortcutPath);
                if (!string.IsNullOrWhiteSpace(existingTarget) &&
                    string.Equals(Path.GetFullPath(existingTarget), Path.GetFullPath(currentExePath), StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogDebug("Shortcut Desktop đã trỏ chính xác vào {ExePath}", currentExePath);
                    return ShortcutResult.Success("Shortcut Desktop đã trỏ chính xác.", desktopDir, isCreatedOrUpdated: false);
                }

                _logger.LogInformation("Phát hiện Shortcut cũ trỏ tới '{OldTarget}'. Đang tự động cập nhật về '{NewTarget}' (Self-Healing)...", existingTarget, currentExePath);
            }
            else
            {
                _logger.LogInformation("Chưa phát hiện Shortcut Desktop. Đang tự động tạo mới...");
            }

            var createResult = CreateOrUpdateShortcut(desktop: true, startMenu: true);
            return createResult with { IsCreatedOrUpdated = createResult.IsSuccess };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi trong quá trình EnsureShortcutSelfHeal");
            return ShortcutResult.Failed(ex.Message);
        }
    }

    public ShortcutResult CreateOrUpdateShortcut(bool desktop = true, bool startMenu = true)
    {
        try
        {
            string currentExePath = GetCurrentExecutablePath();
            string workingDir = AppDomain.CurrentDomain.BaseDirectory;
            string iconPath = Path.Combine(workingDir, "Assets", "app_icon.ico");

            string? createdDesktop = null;
            string? createdStartMenu = null;

            var shellType = Type.GetTypeFromProgID("WScript.Shell");
            if (shellType == null)
            {
                _logger.LogWarning("Không tìm thấy COM Component WScript.Shell để tạo shortcut");
                return ShortcutResult.Failed("Không tìm thấy Windows Script Shell trên hệ thống.");
            }

            dynamic shell = Activator.CreateInstance(shellType)!;

            if (desktop)
            {
                string desktopDir = ResolveDesktopPath(shell);
                string lnkPath = Path.Combine(desktopDir, AppShortcutName);
                SaveShortcut(shell, lnkPath, currentExePath, workingDir, iconPath);
                createdDesktop = desktopDir;
                _logger.LogInformation("Đã tạo/cập nhật Shortcut Desktop tại: {Path}", lnkPath);
            }

            if (startMenu)
            {
                string startMenuDir = ResolveStartMenuProgramsPath(shell);
                string lnkPath = Path.Combine(startMenuDir, AppShortcutName);
                SaveShortcut(shell, lnkPath, currentExePath, workingDir, iconPath);
                createdStartMenu = startMenuDir;
                _logger.LogInformation("Đã tạo/cập nhật Shortcut Start Menu tại: {Path}", lnkPath);
            }

            return ShortcutResult.Success("Đã tạo lối tắt thành công!", createdDesktop, createdStartMenu, isCreatedOrUpdated: true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi tạo/cập nhật Shortcut");
            return ShortcutResult.Failed($"Không thể tạo shortcut: {ex.Message}");
        }
    }

    public ShortcutResult RemoveShortcut(bool desktop = true, bool startMenu = true)
    {
        try
        {
            if (desktop)
            {
                string desktopDir = ResolveDesktopPath(null);
                string lnkPath = Path.Combine(desktopDir, AppShortcutName);
                if (File.Exists(lnkPath))
                {
                    File.Delete(lnkPath);
                    _logger.LogInformation("Đã xóa Shortcut Desktop: {Path}", lnkPath);
                }
            }

            if (startMenu)
            {
                string startMenuDir = ResolveStartMenuProgramsPath(null);
                string lnkPath = Path.Combine(startMenuDir, AppShortcutName);
                if (File.Exists(lnkPath))
                {
                    File.Delete(lnkPath);
                    _logger.LogInformation("Đã xóa Shortcut Start Menu: {Path}", lnkPath);
                }
            }

            return ShortcutResult.Success("Đã gỡ bỏ lối tắt khỏi hệ thống.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi gỡ bỏ Shortcut");
            return ShortcutResult.Failed($"Không thể gỡ bỏ shortcut: {ex.Message}");
        }
    }

    public bool IsDesktopShortcutExists()
    {
        try
        {
            string desktopDir = ResolveDesktopPath(null);
            string lnkPath = Path.Combine(desktopDir, AppShortcutName);
            return File.Exists(lnkPath);
        }
        catch
        {
            return false;
        }
    }

    private static void SaveShortcut(dynamic shell, string lnkPath, string targetExe, string workingDir, string iconPath)
    {
        dynamic shortcut = shell.CreateShortcut(lnkPath);
        shortcut.TargetPath = targetExe;
        shortcut.WorkingDirectory = workingDir;
        shortcut.Description = ShortcutDescription;

        if (File.Exists(iconPath))
        {
            shortcut.IconLocation = $"{iconPath}, 0";
        }
        else
        {
            shortcut.IconLocation = $"{targetExe}, 0";
        }

        shortcut.Save();
    }

    private string ReadShortcutTargetPath(string lnkPath)
    {
        try
        {
            var shellType = Type.GetTypeFromProgID("WScript.Shell");
            if (shellType != null)
            {
                dynamic shell = Activator.CreateInstance(shellType)!;
                dynamic shortcut = shell.CreateShortcut(lnkPath);
                return (string)shortcut.TargetPath;
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Không thể đọc TargetPath từ {Path}", lnkPath);
        }

        return string.Empty;
    }

    private static string ResolveDesktopPath(object? shell)
    {
        if (shell != null)
        {
            try
            {
                dynamic dShell = shell;
                string comDesktop = (string)dShell.SpecialFolders("Desktop");
                if (!string.IsNullOrWhiteSpace(comDesktop) && Directory.Exists(comDesktop))
                {
                    return comDesktop;
                }
            }
            catch { }
        }

        // Fallback 1: WScript.Shell instance
        try
        {
            var shellType = Type.GetTypeFromProgID("WScript.Shell");
            if (shellType != null)
            {
                dynamic localShell = Activator.CreateInstance(shellType)!;
                string comDesktop = (string)localShell.SpecialFolders("Desktop");
                if (!string.IsNullOrWhiteSpace(comDesktop) && Directory.Exists(comDesktop))
                {
                    return comDesktop;
                }
            }
        }
        catch { }

        // Fallback 2: Environment.SpecialFolder.DesktopDirectory
        var fallbackPath = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
        if (!string.IsNullOrWhiteSpace(fallbackPath) && Directory.Exists(fallbackPath))
        {
            return fallbackPath;
        }

        return Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
    }

    private static string ResolveStartMenuProgramsPath(object? shell)
    {
        if (shell != null)
        {
            try
            {
                dynamic dShell = shell;
                string comPrograms = (string)dShell.SpecialFolders("Programs");
                if (!string.IsNullOrWhiteSpace(comPrograms) && Directory.Exists(comPrograms))
                {
                    return comPrograms;
                }
            }
            catch { }
        }

        try
        {
            var shellType = Type.GetTypeFromProgID("WScript.Shell");
            if (shellType != null)
            {
                dynamic localShell = Activator.CreateInstance(shellType)!;
                string comPrograms = (string)localShell.SpecialFolders("Programs");
                if (!string.IsNullOrWhiteSpace(comPrograms) && Directory.Exists(comPrograms))
                {
                    return comPrograms;
                }
            }
        }
        catch { }

        return Environment.GetFolderPath(Environment.SpecialFolder.Programs);
    }

    private string GetCurrentExecutablePath()
    {
        if (_launcherAdapter != null)
        {
            var path = _launcherAdapter.GetExecutablePath();
            if (!string.IsNullOrWhiteSpace(path) && File.Exists(path))
            {
                return path;
            }
        }

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
}
