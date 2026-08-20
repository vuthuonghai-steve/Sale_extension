using System.Drawing;
using AppForms.Frontend.Shared.Hooks;
using AppForms.Frontend.Shared.Theme;
using AppForms.Frontend.Shell.Components;
using AppForms.Frontend.Shell.Hooks;
using AppForms.Frontend.Tray;
using AppForms.Shared.Constants;
using AppForms.Shared.Enums;
using Microsoft.Extensions.Logging;

namespace AppForms.Frontend.Shell;

/// <summary>
/// Application Shell Window - Cửa sổ chính định hình khung Sidepanel và điều phối hiển thị Component
/// </summary>
public class MainForm : Form
{
    private readonly ILogger<MainForm> _logger;
    private readonly ShellStateHook _stateHook;
    private readonly TrayIconManager _trayManager;

    private readonly ShellHeaderPanel _headerPanel;
    private readonly ShellFooterPanel _footerPanel;
    private readonly ScreenHostContainer _screenHostContainer;

    public MainForm(
        ILogger<MainForm> logger,
        ShellStateHook stateHook,
        TrayIconManager trayManager)
    {
        _logger = logger;
        _stateHook = stateHook;
        _trayManager = trayManager;

        _headerPanel = new ShellHeaderPanel();
        _footerPanel = new ShellFooterPanel();
        _screenHostContainer = new ScreenHostContainer();

        InitializeSidepanelWindow();
        InitializeLayout();
        BindHookEvents();
    }

    private void InitializeSidepanelWindow()
    {
        Text = $"{AppConstants.AppName} (Sidepanel)";
        StartPosition = FormStartPosition.Manual;

        var workingArea = Screen.PrimaryScreen?.WorkingArea ?? Screen.AllScreens[0].WorkingArea;
        var panelWidth = Math.Max(380, Math.Min(460, workingArea.Width / 4));

        Size = new Size(panelWidth, workingArea.Height);
        Location = new Point(workingArea.Right - panelWidth, workingArea.Top);
        MinimumSize = new Size(360, 520);

        BackColor = AppColors.BackgroundDark;
        ForeColor = AppColors.TextPrimary;
        Font = AppFonts.Body;
        Icon = AppIconProvider.GetAppIcon();
        ShowIcon = true;
    }

    private void InitializeLayout()
    {
        Controls.Add(_screenHostContainer);
        Controls.Add(_headerPanel);
        Controls.Add(_footerPanel);
        _screenHostContainer.BringToFront();
    }

    private void BindHookEvents()
    {
        _headerPanel.BackHomeRequested += () => _stateHook.NavigateHome();
        _headerPanel.PinToggleRequested += () => _stateHook.TogglePinTop();

        _stateHook.TopMostChanged += isPinned => FormStateObserver.InvokeOnUI(this, () => TopMost = isPinned);
        _stateHook.StateChanged += state => FormStateObserver.InvokeOnUI(this, () =>
        {
            _headerPanel.BindState(state);
            _footerPanel.SetStatusText(state.FooterStatus);
        });

        _stateHook.ScreenResolved += screenInstance => FormStateObserver.InvokeOnUI(this, () =>
        {
            _screenHostContainer.MountScreen(screenInstance as Control);
        });
    }

    public void UpdateFooterStatus(string message) => _stateHook.UpdateFooterStatus(message);

    protected override void OnShown(EventArgs e)
    {
        base.OnShown(e);
        _trayManager.Initialize(this);
        _stateHook.NavigateTo(AppRouteId.Dashboard);

        if (_stateHook.AutoStartClipboardListening)
        {
            _stateHook.StartClipboardMonitor(Handle);
        }
    }

    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        if (e.CloseReason == CloseReason.UserClosing && _stateHook.MinimizeToTrayOnClose)
        {
            e.Cancel = true;
            Hide();
            _trayManager.ShowNotification(AppConstants.AppName, "Trợ lý Sidepanel đang chạy ngầm.");
            return;
        }

        _stateHook.StopClipboardMonitor(Handle);
        base.OnFormClosing(e);
    }
}
