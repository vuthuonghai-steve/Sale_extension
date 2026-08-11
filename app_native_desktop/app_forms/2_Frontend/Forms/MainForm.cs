using System.Drawing;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Frontend.Screens.LeadConverter;
using AppForms.Frontend.Screens.Settings;
using AppForms.Frontend.Shared.Components;
using AppForms.Frontend.Shared.Theme;
using AppForms.Frontend.Tray;
using AppForms.Shared.Constants;
using Microsoft.Extensions.Logging;

namespace AppForms.Frontend.Forms;

public class MainForm : Form
{
    private readonly ILogger<MainForm> _logger;
    private readonly IFormConverterService _converterService;
    private readonly ISettingsService _settingsService;
    private readonly TrayIconManager _trayManager;

    // Screens
    private readonly LeadConverterScreen _leadConverterScreen;
    private readonly SettingsScreen _settingsScreen;

    // Header & Navigation Controls
    private Panel _screenContainer = null!;
    private ModernButton _btnNavConverter = null!;
    private ModernButton _btnNavSettings = null!;
    private ModernButton _btnPinTop = null!;
    private StatusBadge _statusBadge = null!;
    private Label _lblFooterStatus = null!;
    private Label _lblCtvHeader = null!;

    public MainForm(
        ILogger<MainForm> logger,
        IFormConverterService converterService,
        ISchemaManager schemaManager,
        ISettingsService settingsService,
        ITemplateEngine templateEngine,
        ISchemaDetector schemaDetector,
        TrayIconManager trayManager)
    {
        _logger = logger;
        _converterService = converterService;
        _settingsService = settingsService;
        _trayManager = trayManager;

        // Initialize Screens
        _leadConverterScreen = new LeadConverterScreen(converterService, schemaManager, settingsService, templateEngine, schemaDetector);
        _settingsScreen = new SettingsScreen(settingsService);

        InitializeSidepanelWindow();
        InitializeUI();
        RegisterEvents();
    }

    private void InitializeSidepanelWindow()
    {
        Text = $"{AppConstants.AppName} (Sidepanel)";
        StartPosition = FormStartPosition.Manual;

        // Tự động tính toán kích thước 1/4 màn hình desktop, Full Height
        var workingArea = Screen.PrimaryScreen?.WorkingArea ?? Screen.AllScreens[0].WorkingArea;
        var panelWidth = Math.Max(380, Math.Min(460, workingArea.Width / 4));
        var panelHeight = workingArea.Height;

        Size = new Size(panelWidth, panelHeight);
        Location = new Point(workingArea.Right - panelWidth, workingArea.Top);
        MinimumSize = new Size(350, 500);

        BackColor = AppColors.BackgroundDark;
        ForeColor = AppColors.TextPrimary;
        Font = AppFonts.Body;

        // Cấu hình App Icon
        Icon = AppIconProvider.GetAppIcon();
        ShowIcon = true;
    }

    private void InitializeUI()
    {
        // 1. Top Header Bar
        var headerPanel = BuildHeaderPanel();

        // 2. Navigation Tab Bar
        var navPanel = BuildNavPanel();

        // 3. Bottom Footer
        var footerPanel = BuildFooterPanel();

        // 4. Main Screen Host Container
        _screenContainer = new Panel
        {
            Dock = DockStyle.Fill,
            BackColor = AppColors.BackgroundDark
        };

        // Default screen: Lead Converter
        ShowScreen(_leadConverterScreen);

        Controls.Add(_screenContainer);
        Controls.Add(navPanel);
        Controls.Add(headerPanel);
        Controls.Add(footerPanel);
    }

    private Panel BuildHeaderPanel()
    {
        var panel = new Panel
        {
            Dock = DockStyle.Top,
            Height = 56,
            BackColor = AppColors.SurfaceDark,
            Padding = new Padding(12, 8, 12, 8)
        };

        var lblTitle = new Label
        {
            Text = "⚡ SALE ASSISTANT",
            Font = AppFonts.Header,
            ForeColor = AppColors.TextPrimary,
            AutoSize = true,
            Location = new Point(10, 10)
        };

        _lblCtvHeader = new Label
        {
            Text = $"👤 CTV: {_settingsService.Current.FixedCtvName}",
            Font = AppFonts.CaptionBold,
            ForeColor = AppColors.PrimaryHover,
            AutoSize = true,
            Location = new Point(12, 32)
        };

        // Pin TopMost Button
        _btnPinTop = new ModernButton
        {
            Text = "📌 Ghim",
            Size = new Size(68, 26),
            Font = AppFonts.Badge,
            CustomBackColor = TopMost ? AppColors.Primary : AppColors.SurfaceHighlight,
            CustomHoverColor = AppColors.BorderHighlight,
            Anchor = AnchorStyles.Top | AnchorStyles.Right,
            Location = new Point(panel.Width - 150, 12)
        };
        _btnPinTop.Click += (_, _) =>
        {
            TopMost = !TopMost;
            _btnPinTop.CustomBackColor = TopMost ? AppColors.Primary : AppColors.SurfaceHighlight;
            _btnPinTop.Text = TopMost ? "📌 Đã ghim" : "📌 Ghim";
        };

        // Clipboard Monitor Status Badge
        _statusBadge = new StatusBadge
        {
            Location = new Point(panel.Width - 75, 14),
            Anchor = AnchorStyles.Top | AnchorStyles.Right,
            BadgeText = _converterService.IsClipboardListening ? "ACTIVE" : "PAUSED",
            BadgeColor = _converterService.IsClipboardListening ? AppColors.Success : AppColors.Danger
        };

        panel.Controls.Add(lblTitle);
        panel.Controls.Add(_lblCtvHeader);
        panel.Controls.Add(_btnPinTop);
        panel.Controls.Add(_statusBadge);

        return panel;
    }

    private Panel BuildNavPanel()
    {
        var panel = new Panel
        {
            Dock = DockStyle.Top,
            Height = 38,
            BackColor = AppColors.SurfaceInput,
            Padding = new Padding(8, 4, 8, 4)
        };

        _btnNavConverter = new ModernButton
        {
            Text = "📋 Chuyển Đổi Lead",
            Size = new Size(130, 28),
            Font = AppFonts.CaptionBold,
            CustomBackColor = AppColors.Primary,
            Location = new Point(8, 5)
        };
        _btnNavConverter.Click += (_, _) =>
        {
            ShowScreen(_leadConverterScreen);
            _btnNavConverter.CustomBackColor = AppColors.Primary;
            _btnNavSettings.CustomBackColor = AppColors.SurfaceHighlight;
        };

        _btnNavSettings = new ModernButton
        {
            Text = "⚙️ Cài Đặt",
            Size = new Size(90, 28),
            Font = AppFonts.Caption,
            CustomBackColor = AppColors.SurfaceHighlight,
            Location = new Point(_btnNavConverter.Right + 8, 5)
        };
        _btnNavSettings.Click += (_, _) =>
        {
            ShowScreen(_settingsScreen);
            _btnNavSettings.CustomBackColor = AppColors.Primary;
            _btnNavConverter.CustomBackColor = AppColors.SurfaceHighlight;
        };

        panel.Controls.Add(_btnNavConverter);
        panel.Controls.Add(_btnNavSettings);

        return panel;
    }

    private Panel BuildFooterPanel()
    {
        var panel = new Panel
        {
            Dock = DockStyle.Bottom,
            Height = 26,
            BackColor = AppColors.SurfaceInput,
            Padding = new Padding(10, 4, 10, 4)
        };

        _lblFooterStatus = new Label
        {
            Text = $"Sẵn sàng | Sidepanel Assistant | v{AppConstants.AppVersion}",
            Font = AppFonts.Badge,
            ForeColor = AppColors.TextMuted,
            Dock = DockStyle.Fill,
            TextAlign = ContentAlignment.MiddleLeft
        };
        panel.Controls.Add(_lblFooterStatus);

        return panel;
    }

    private void ShowScreen(UserControl screen)
    {
        _screenContainer.Controls.Clear();
        screen.Dock = DockStyle.Fill;
        _screenContainer.Controls.Add(screen);
    }

    private void RegisterEvents()
    {
        _leadConverterScreen.StatusMessageUpdated += msg =>
        {
            _lblFooterStatus.Text = $"{msg} | {DateTime.Now:HH:mm:ss}";
        };

        _settingsScreen.SettingsSaved += () =>
        {
            _lblCtvHeader.Text = $"👤 CTV: {_settingsService.Current.FixedCtvName}";
            _leadConverterScreen.NotifyCtvUpdated();
            _lblFooterStatus.Text = "Đã cập nhật cài đặt ứng dụng.";
        };

        _converterService.ClipboardListeningStateChanged += (_, isListening) =>
        {
            _statusBadge.BadgeText = isListening ? "ACTIVE" : "PAUSED";
            _statusBadge.BadgeColor = isListening ? AppColors.Success : AppColors.Danger;
        };
    }

    protected override void OnShown(EventArgs e)
    {
        base.OnShown(e);
        _trayManager.Initialize(this);

        if (_settingsService.Current.AutoStartClipboardListening)
        {
            _converterService.StartClipboardMonitor(Handle);
        }
    }

    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        if (e.CloseReason == CloseReason.UserClosing && _settingsService.Current.MinimizeToTrayOnClose)
        {
            e.Cancel = true;
            Hide();
            _trayManager.ShowNotification(AppConstants.AppName, "Trợ lý Sidepanel đang chạy ngầm.");
            return;
        }

        _converterService.StopClipboardMonitor(Handle);
        base.OnFormClosing(e);
    }
}
