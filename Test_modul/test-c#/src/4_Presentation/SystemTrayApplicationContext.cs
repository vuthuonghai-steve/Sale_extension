using System.Drawing;
using ClipboardFilterApp.Contracts;
using ClipboardFilterApp.PlatformAdapters.Logging;

namespace ClipboardFilterApp.Presentation;

/// <summary>
/// Quản lý giao diện System Tray góc phải màn hình Windows (No Main Window App)
/// </summary>
public class SystemTrayApplicationContext : ApplicationContext
{
    private readonly NotifyIcon _notifyIcon;
    private readonly ContextMenuStrip _contextMenu;
    private readonly FilterOptions _options;
    private bool _disposed;

    public SystemTrayApplicationContext(FilterOptions options)
    {
        _options = options;

        ToolStripMenuItem enableMenuItem = new ToolStripMenuItem("Bật Bộ Lọc OS Clipboard", null, OnToggleService)
        {
            Checked = _options.EnableService
        };

        ToolStripMenuItem exitMenuItem = new ToolStripMenuItem("Thoát Ứng Dụng", null, OnExit);

        _contextMenu = new ContextMenuStrip();
        _contextMenu.Items.Add(enableMenuItem);
        _contextMenu.Items.Add(new ToolStripSeparator());
        _contextMenu.Items.Add(exitMenuItem);

        _notifyIcon = new NotifyIcon
        {
            Icon = SystemIcons.Shield, // Dùng Shield icon mặc định của Windows OS
            ContextMenuStrip = _contextMenu,
            Text = "OS Clipboard Filter - Đang Hoạt Động",
            Visible = true
        };

        _notifyIcon.ShowBalloonTip(2000, "OS Clipboard Filter", "Dịch vụ lọc dữ liệu Clipboard đã khởi động ngầm thành công!", ToolTipIcon.Info);
    }

    private void OnToggleService(object? sender, EventArgs e)
    {
        if (sender is ToolStripMenuItem menuItem)
        {
            // Đồng bộ trạng thái Bật/Tắt trực tiếp vào FilterOptions toàn cục
            _options.EnableService = !_options.EnableService;
            menuItem.Checked = _options.EnableService;

            string statusText = _options.EnableService ? "OS Clipboard Filter - Đang Hoạt Động" : "OS Clipboard Filter - Tạm Dừng Lọc";
            _notifyIcon.Text = statusText;

            string toastTitle = _options.EnableService ? "Đã BẬT Bộ Lọc OS" : "Đã TẮT Bộ Lọc OS";
            string toastMessage = _options.EnableService 
                ? "Hệ thống sẽ tự động lọc dữ liệu rác khi bấm Ctrl+C." 
                : "Hệ thống đã tạm dừng lọc. Dữ liệu Ctrl+C sẽ giữ nguyên 100%.";

            _notifyIcon.ShowBalloonTip(2000, toastTitle, toastMessage, _options.EnableService ? ToolTipIcon.Info : ToolTipIcon.Warning);
            WindowsLoggerAdapter.LogInfo($"[SYSTEM TRAY MENU] {toastTitle}: {toastMessage}");
        }
    }

    private void OnExit(object? sender, EventArgs e)
    {
        ExitThread();
    }

    protected override void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                if (_notifyIcon != null)
                {
                    _notifyIcon.Visible = false;
                    _notifyIcon.Dispose();
                }
                _contextMenu?.Dispose();
            }
            _disposed = true;
        }

        base.Dispose(disposing);
    }
}
