using AppForms.Backend.Contracts.Interfaces;
using AppForms.Frontend.Shared.Theme;
using AppForms.Shared.Constants;
using Microsoft.Extensions.Logging;

namespace AppForms.Frontend.Tray;

public class TrayIconManager : IDisposable
{
    private readonly ILogger<TrayIconManager> _logger;
    private readonly IFormConverterService _converterService;
    private readonly ISettingsService _settingsService;
    private NotifyIcon? _notifyIcon;
    private Form? _mainForm;

    public TrayIconManager(
        ILogger<TrayIconManager> logger,
        IFormConverterService converterService,
        ISettingsService settingsService)
    {
        _logger = logger;
        _converterService = converterService;
        _settingsService = settingsService;
    }

    public void Initialize(Form mainForm)
    {
        _mainForm = mainForm;

        var contextMenu = new ContextMenuStrip();
        var itemShow = contextMenu.Items.Add("Hiện cửa sổ");
        itemShow.Click += (_, _) => RestoreFromTray();

        var itemToggleMonitor = contextMenu.Items.Add(_converterService.IsClipboardListening ? "Tạm dừng bắt Clipboard" : "Bắt đầu bắt Clipboard");
        itemToggleMonitor.Click += (_, _) =>
        {
            if (_converterService.IsClipboardListening)
            {
                _converterService.StopClipboardMonitor(_mainForm.Handle);
                itemToggleMonitor.Text = "Bắt đầu bắt Clipboard";
            }
            else
            {
                _converterService.StartClipboardMonitor(_mainForm.Handle);
                itemToggleMonitor.Text = "Tạm dừng bắt Clipboard";
            }
        };

        contextMenu.Items.Add(new ToolStripSeparator());
        var itemExit = contextMenu.Items.Add("Thoát ứng dụng");
        itemExit.Click += (_, _) => Application.Exit();

        _notifyIcon = new NotifyIcon
        {
            Icon = AppIconProvider.GetAppIcon(),
            Text = AppConstants.AppName,
            ContextMenuStrip = contextMenu,
            Visible = true
        };

        _notifyIcon.DoubleClick += (_, _) => RestoreFromTray();
        _logger.LogInformation("TrayIconManager đã khởi tạo thành công.");
    }

    public void RestoreFromTray()
    {
        if (_mainForm == null) return;
        _mainForm.Show();
        _mainForm.WindowState = FormWindowState.Normal;
        _mainForm.BringToFront();
        _mainForm.Activate();
    }

    public void ShowNotification(string title, string message, ToolTipIcon icon = ToolTipIcon.Info)
    {
        _notifyIcon?.ShowBalloonTip(3000, title, message, icon);
    }

    public void Dispose()
    {
        if (_notifyIcon != null)
        {
            _notifyIcon.Visible = false;
            _notifyIcon.Dispose();
            _notifyIcon = null;
        }
        GC.SuppressFinalize(this);
    }
}
