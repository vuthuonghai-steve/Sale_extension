using AppForms.Backend.Contracts.Interfaces;
using AppForms.Frontend.Shared.Components;
using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Screens.Settings;

public class SettingsScreen : UserControl
{
    private readonly ISettingsService _settingsService;
    private TextBox _txtCtvName = null!;
    private CheckBox _chkAutoClipboard = null!;
    private CheckBox _chkMinimizeTray = null!;
    private ModernButton _btnSave = null!;

    public event Action? SettingsSaved;

    public SettingsScreen(ISettingsService settingsService)
    {
        _settingsService = settingsService;
        InitializeLayout();
        LoadCurrentSettings();
    }

    private void InitializeLayout()
    {
        Dock = DockStyle.Fill;
        BackColor = AppColors.BackgroundDark;
        Padding = new Padding(16);

        var lblHeader = new Label
        {
            Text = "⚙️ CÀI ĐẶT ỨNG DỤNG",
            Font = AppFonts.Header,
            ForeColor = AppColors.TextPrimary,
            Dock = DockStyle.Top,
            Height = 36
        };

        var panelForm = new Panel
        {
            Dock = DockStyle.Top,
            AutoSize = true,
            BackColor = AppColors.SurfaceDark,
            Padding = new Padding(12)
        };

        var lblCtv = new Label
        {
            Text = "Tên CTV Cố Định:",
            Font = AppFonts.SubHeader,
            ForeColor = AppColors.TextSecondary,
            Dock = DockStyle.Top,
            Height = 26
        };

        _txtCtvName = new TextBox
        {
            Dock = DockStyle.Top,
            Font = AppFonts.BodyBold,
            BackColor = AppColors.SurfaceInput,
            ForeColor = AppColors.TextPrimary,
            BorderStyle = BorderStyle.FixedSingle
        };

        var spacer1 = new Panel { Dock = DockStyle.Top, Height = 14 };

        _chkAutoClipboard = new CheckBox
        {
            Text = "Tự động bắt nội dung khi Copy (Clipboard Monitor)",
            Font = AppFonts.Body,
            ForeColor = AppColors.TextPrimary,
            Dock = DockStyle.Top,
            Height = 28
        };

        _chkMinimizeTray = new CheckBox
        {
            Text = "Thu nhỏ xuống khay hệ thống (Tray) khi đóng cửa sổ",
            Font = AppFonts.Body,
            ForeColor = AppColors.TextPrimary,
            Dock = DockStyle.Top,
            Height = 28
        };

        var spacer2 = new Panel { Dock = DockStyle.Top, Height = 16 };

        _btnSave = new ModernButton
        {
            Text = "💾 LƯU CÀI ĐẶT",
            CustomBackColor = AppColors.Primary,
            CustomHoverColor = AppColors.PrimaryHover,
            Font = AppFonts.BodyBold,
            Dock = DockStyle.Top,
            Height = 36
        };
        _btnSave.Click += BtnSave_Click;

        panelForm.Controls.Add(_btnSave);
        panelForm.Controls.Add(spacer2);
        panelForm.Controls.Add(_chkMinimizeTray);
        panelForm.Controls.Add(_chkAutoClipboard);
        panelForm.Controls.Add(spacer1);
        panelForm.Controls.Add(_txtCtvName);
        panelForm.Controls.Add(lblCtv);

        Controls.Add(panelForm);
        Controls.Add(lblHeader);
    }

    private void LoadCurrentSettings()
    {
        var cur = _settingsService.Current;
        _txtCtvName.Text = cur.FixedCtvName;
        _chkAutoClipboard.Checked = cur.AutoStartClipboardListening;
        _chkMinimizeTray.Checked = cur.MinimizeToTrayOnClose;
    }

    private void BtnSave_Click(object? sender, EventArgs e)
    {
        _settingsService.Update(s =>
        {
            s.FixedCtvName = _txtCtvName.Text.Trim();
            s.AutoStartClipboardListening = _chkAutoClipboard.Checked;
            s.MinimizeToTrayOnClose = _chkMinimizeTray.Checked;
        });

        _btnSave.Text = "✅ ĐÃ LƯU THÀNH CÔNG!";
        _btnSave.CustomBackColor = AppColors.Success;

        var timer = new System.Windows.Forms.Timer { Interval = 1500 };
        timer.Tick += (_, _) =>
        {
            _btnSave.Text = "💾 LƯU CÀI ĐẶT";
            _btnSave.CustomBackColor = AppColors.Primary;
            timer.Stop();
            timer.Dispose();
        };
        timer.Start();

        SettingsSaved?.Invoke();
    }
}
