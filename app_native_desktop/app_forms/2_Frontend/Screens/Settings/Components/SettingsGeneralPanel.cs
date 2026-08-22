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
    private ModernButton _btnCreateShortcut = null!;
    private ModernButton _btnRemoveShortcut = null!;

    public event Action<SettingsFormModel>? SaveRequested;
    public event Action? CreateShortcutRequested;
    public event Action? RemoveShortcutRequested;

    public SettingsGeneralPanel()
    {
        InitializeUI();
    }

    private void InitializeUI()
    {
        Padding = new Padding(8, 8, 2, 8);

        var scrollPanel = new SlimScrollPanel { Dock = DockStyle.Fill };

        var cardPanel = new Panel
        {
            Dock = DockStyle.Top,
            Height = 220,
            AutoSize = true,
            AutoSizeMode = AutoSizeMode.GrowAndShrink,
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

        var spacerCard = new Panel { Dock = DockStyle.Top, Height = 14 };

        var shortcutCard = new Panel
        {
            Dock = DockStyle.Top,
            AutoSize = true,
            AutoSizeMode = AutoSizeMode.GrowAndShrink,
            BackColor = AppColors.SurfaceDark,
            Padding = new Padding(14)
        };

        var lblShortcutTitle = new Label
        {
            Text = "⚡ Lối Tắt Màn Hình (Desktop Shortcut):",
            Font = AppFonts.SubHeader,
            ForeColor = AppColors.TextPrimary,
            Dock = DockStyle.Top,
            Height = 26
        };

        var lblShortcutDesc = new Label
        {
            Text = "Tự động nhận diện và cập nhật lối tắt ngoài Desktop & Start Menu khi mở app.",
            Font = AppFonts.Caption,
            ForeColor = AppColors.TextSecondary,
            Dock = DockStyle.Top,
            Height = 24
        };

        var shortcutActionPanel = new Panel
        {
            Dock = DockStyle.Top,
            Height = 36
        };

        _btnCreateShortcut = new ModernButton
        {
            Text = "⚡ TẠO / LÀM MỚI LỐI TẮT",
            CustomBackColor = AppColors.SurfaceHighlight,
            CustomHoverColor = AppColors.Primary,
            Font = AppFonts.CaptionBold,
            Dock = DockStyle.Left,
            Width = 190
        };
        _btnCreateShortcut.Click += (_, _) => CreateShortcutRequested?.Invoke();

        var btnSpacer = new Panel { Dock = DockStyle.Left, Width = 10 };

        _btnRemoveShortcut = new ModernButton
        {
            Text = "🗑️ GỠ BỎ LỐI TẮT",
            CustomBackColor = AppColors.SurfaceHighlight,
            CustomHoverColor = AppColors.Danger,
            Font = AppFonts.CaptionBold,
            Dock = DockStyle.Left,
            Width = 140
        };
        _btnRemoveShortcut.Click += (_, _) => RemoveShortcutRequested?.Invoke();

        shortcutActionPanel.Controls.Add(_btnRemoveShortcut);
        shortcutActionPanel.Controls.Add(btnSpacer);
        shortcutActionPanel.Controls.Add(_btnCreateShortcut);

        shortcutCard.Controls.Add(shortcutActionPanel);
        shortcutCard.Controls.Add(lblShortcutDesc);
        shortcutCard.Controls.Add(lblShortcutTitle);

        scrollPanel.Content.Controls.Add(shortcutCard);
        scrollPanel.Content.Controls.Add(spacerCard);
        scrollPanel.Content.Controls.Add(cardPanel);
        Controls.Add(scrollPanel);
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

    public void ShowShortcutSuccessFeedback(string message)
    {
        _btnCreateShortcut.Text = "✅ ĐÃ TẠO LỐI TẮT!";
        _btnCreateShortcut.CustomBackColor = AppColors.Success;

        var timer = new System.Windows.Forms.Timer { Interval = 2000 };
        timer.Tick += (_, _) =>
        {
            _btnCreateShortcut.Text = "⚡ TẠO / LÀM MỚI LỐI TẮT";
            _btnCreateShortcut.CustomBackColor = AppColors.SurfaceHighlight;
            timer.Stop();
            timer.Dispose();
        };
        timer.Start();

        MessageBox.Show(
            $"⚡ {message}\n\nLối tắt 'Sale Lead Assistant' đã sẵn sàng ngoài màn hình Desktop và Start Menu.",
            "Thông Báo Lối Tắt",
            MessageBoxButtons.OK,
            MessageBoxIcon.Information);
    }

    public void ShowShortcutRemovedFeedback(string message)
    {
        _btnRemoveShortcut.Text = "✅ ĐÃ GỠ BỎ!";
        _btnRemoveShortcut.CustomBackColor = AppColors.Warning;

        var timer = new System.Windows.Forms.Timer { Interval = 2000 };
        timer.Tick += (_, _) =>
        {
            _btnRemoveShortcut.Text = "🗑️ GỠ BỎ LỐI TẮT";
            _btnRemoveShortcut.CustomBackColor = AppColors.SurfaceHighlight;
            timer.Stop();
            timer.Dispose();
        };
        timer.Start();

        MessageBox.Show(
            message,
            "Gỡ Bỏ Lối Tắt",
            MessageBoxButtons.OK,
            MessageBoxIcon.Information);
    }
}
