using AppForms.Frontend.Screens.Settings.Models;
using AppForms.Frontend.Shared.Components;
using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Screens.Settings.Components;

public class SettingsGeneralPanel : Panel
{
    private TextBox _txtCtvName = null!;
    private CheckBox _chkAutoClipboard = null!;
    private CheckBox _chkMinimizeTray = null!;
    private ModernButton _btnSave = null!;

    public event Action<SettingsFormModel>? SaveRequested;

    public SettingsGeneralPanel()
    {
        InitializeUI();
    }

    private void InitializeUI()
    {
        Dock = DockStyle.Fill;
        BackColor = AppColors.BackgroundDark;
        AutoScroll = true;
        Padding = new Padding(12);

        var cardPanel = new Panel
        {
            Dock = DockStyle.Top,
            AutoSize = true,
            BackColor = AppColors.SurfaceDark,
            Padding = new Padding(14)
        };

        var lblCtv = new Label
        {
            Text = "👤 Tên CTV Cố Định:",
            Font = AppFonts.SubHeader,
            ForeColor = AppColors.TextPrimary,
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

        var spacer2 = new Panel { Dock = DockStyle.Top, Height = 18 };

        _btnSave = new ModernButton
        {
            Text = "💾 LƯU CÀI ĐẶT CHUNG",
            CustomBackColor = AppColors.Primary,
            CustomHoverColor = AppColors.PrimaryHover,
            Font = AppFonts.BodyBold,
            Dock = DockStyle.Top,
            Height = 38
        };
        _btnSave.Click += (_, _) =>
        {
            SaveRequested?.Invoke(GetFormData());
        };

        cardPanel.Controls.Add(_btnSave);
        cardPanel.Controls.Add(spacer2);
        cardPanel.Controls.Add(_chkMinimizeTray);
        cardPanel.Controls.Add(_chkAutoClipboard);
        cardPanel.Controls.Add(spacer1);
        cardPanel.Controls.Add(_txtCtvName);
        cardPanel.Controls.Add(lblCtv);

        Controls.Add(cardPanel);
    }

    public void BindData(SettingsFormModel model)
    {
        _txtCtvName.Text = model.FixedCtvName;
        _chkAutoClipboard.Checked = model.AutoStartClipboardListening;
        _chkMinimizeTray.Checked = model.MinimizeToTrayOnClose;
    }

    public SettingsFormModel GetFormData()
    {
        return new SettingsFormModel
        {
            FixedCtvName = _txtCtvName.Text.Trim(),
            AutoStartClipboardListening = _chkAutoClipboard.Checked,
            MinimizeToTrayOnClose = _chkMinimizeTray.Checked
        };
    }

    public void ShowSaveSuccessFeedback()
    {
        _btnSave.Text = "✅ ĐÃ LƯU THÀNH CÔNG!";
        _btnSave.CustomBackColor = AppColors.Success;

        var timer = new System.Windows.Forms.Timer { Interval = 1500 };
        timer.Tick += (_, _) =>
        {
            _btnSave.Text = "💾 LƯU CÀI ĐẶT CHUNG";
            _btnSave.CustomBackColor = AppColors.Primary;
            timer.Stop();
            timer.Dispose();
        };
        timer.Start();
    }
}
