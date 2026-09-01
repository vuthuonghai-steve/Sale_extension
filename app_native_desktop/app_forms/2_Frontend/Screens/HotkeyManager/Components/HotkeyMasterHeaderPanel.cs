using System;
using System.Drawing;
using System.Windows.Forms;
using AppForms.Frontend.Screens.HotkeyManager.Models;
using AppForms.Frontend.Shared.Components;
using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Screens.HotkeyManager.Components;

/// <summary>
/// Sub-Component hiển thị công tắc tổng (Master Switch) và trạng thái toàn cục của hệ thống phím tắt
/// </summary>
public class HotkeyMasterHeaderPanel : Panel
{
    private readonly Label _lblTitle;
    private readonly Label _lblStatus;
    private readonly Label _lblHint;
    private readonly ModernButton _btnMasterToggle;

    public event Action? GlobalListeningToggled;

    public HotkeyMasterHeaderPanel()
    {
        Dock = DockStyle.Top;
        Height = 115;
        BackColor = AppColors.SurfaceDark;
        Padding = new Padding(12);

        _lblTitle = new Label
        {
            Text = "⌨️ Quản Trị Phím Tắt Toàn Cục",
            Font = AppFonts.Header,
            ForeColor = AppColors.TextPrimary,
            AutoSize = true,
            Location = new Point(12, 12)
        };

        _lblStatus = new Label
        {
            Text = "Đang kiểm tra trạng thái...",
            Font = AppFonts.BodyBold,
            ForeColor = AppColors.Success,
            AutoSize = true,
            Location = new Point(12, 38)
        };

        _lblHint = new Label
        {
            Text = "💡 Phím tắt hoạt động toàn hệ thống ngay cả khi ứng dụng đang thu nhỏ.",
            Font = AppFonts.Caption,
            ForeColor = AppColors.TextMuted,
            AutoSize = true,
            Location = new Point(12, 62)
        };

        _btnMasterToggle = new ModernButton
        {
            Text = "🟢 ĐANG BẬT",
            Font = AppFonts.CaptionBold,
            Size = new Size(130, 34),
            Location = new Point(12, 75),
            CustomBackColor = AppColors.Success
        };
        _btnMasterToggle.Click += (_, _) => GlobalListeningToggled?.Invoke();

        Controls.Add(_lblTitle);
        Controls.Add(_lblStatus);
        Controls.Add(_lblHint);
        Controls.Add(_btnMasterToggle);
    }

    public void BindData(HotkeyManagerFormModel model)
    {
        _lblStatus.Text = model.StatusSummary;
        _lblStatus.ForeColor = model.IsGlobalListening ? AppColors.Success : AppColors.TextMuted;

        if (model.IsGlobalListening)
        {
            _btnMasterToggle.Text = "🟢 TẮT TOÀN CỤC";
            _btnMasterToggle.CustomBackColor = AppColors.Danger;
        }
        else
        {
            _btnMasterToggle.Text = "⚪ BẬT LẠI TẤT CẢ";
            _btnMasterToggle.CustomBackColor = AppColors.Success;
        }

        // Căn chỉnh vị trí nút Master Toggle sang bên phải
        _btnMasterToggle.Location = new Point(Math.Max(12, Width - _btnMasterToggle.Width - 16), 20);
    }

    protected override void OnResize(EventArgs eventargs)
    {
        base.OnResize(eventargs);
        if (_btnMasterToggle != null)
        {
            _btnMasterToggle.Location = new Point(Math.Max(12, Width - _btnMasterToggle.Width - 16), 20);
        }
    }
}
