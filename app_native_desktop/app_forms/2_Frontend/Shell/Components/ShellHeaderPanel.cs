using System.Drawing;
using AppForms.Frontend.Shared.Components;
using AppForms.Frontend.Shared.Theme;
using AppForms.Frontend.Shell.Models;

namespace AppForms.Frontend.Shell.Components;

/// <summary>
/// Sub-Component hiển thị thanh Header của Shell Container
/// </summary>
public class ShellHeaderPanel : Panel
{
    private readonly ModernButton _btnBackHome;
    private readonly Label _lblTitle;
    private readonly Label _lblCtvHeader;
    private readonly ModernButton _btnPinTop;
    private readonly StatusBadge _statusBadge;

    public event Action? BackHomeRequested;
    public event Action? PinToggleRequested;

    public ShellHeaderPanel()
    {
        Dock = DockStyle.Top;
        Height = 56;
        BackColor = AppColors.SurfaceDark;
        Padding = new Padding(12, 8, 12, 8);

        _btnBackHome = new ModernButton
        {
            Text = "← Trang Chủ",
            Size = new Size(92, 32),
            Font = AppFonts.CaptionBold,
            CustomBackColor = AppColors.SurfaceHighlight,
            CustomHoverColor = AppColors.BorderHighlight,
            Location = new Point(10, 12),
            Visible = false
        };
        _btnBackHome.Click += (_, _) => BackHomeRequested?.Invoke();

        _lblTitle = new Label
        {
            Text = "⚡ SALE ASSISTANT",
            Font = AppFonts.Header,
            ForeColor = AppColors.TextPrimary,
            AutoSize = true,
            Location = new Point(10, 8)
        };

        _lblCtvHeader = new Label
        {
            Text = "👤 CTV: Chưa cấu hình",
            Font = AppFonts.CaptionBold,
            ForeColor = AppColors.PrimaryHover,
            AutoSize = true,
            Location = new Point(12, 30)
        };

        var rightToolsPanel = new Panel
        {
            Dock = DockStyle.Right,
            Width = 160,
            BackColor = Color.Transparent
        };

        _btnPinTop = new ModernButton
        {
            Text = "📌 Ghim",
            Size = new Size(68, 26),
            Font = AppFonts.Badge,
            CustomBackColor = AppColors.SurfaceHighlight,
            CustomHoverColor = AppColors.BorderHighlight,
            Location = new Point(10, 14)
        };
        _btnPinTop.Click += (_, _) => PinToggleRequested?.Invoke();

        _statusBadge = new StatusBadge
        {
            Location = new Point(85, 16),
            BadgeText = "PAUSED",
            BadgeColor = AppColors.Danger
        };

        rightToolsPanel.Controls.Add(_btnPinTop);
        rightToolsPanel.Controls.Add(_statusBadge);

        Controls.Add(_btnBackHome);
        Controls.Add(_lblTitle);
        Controls.Add(_lblCtvHeader);
        Controls.Add(rightToolsPanel);
    }

    public void BindState(ShellStateModel state)
    {
        _lblCtvHeader.Text = $"👤 CTV: {state.FixedCtvName}";
        _lblTitle.Text = state.RouteTitle;

        _btnPinTop.CustomBackColor = state.IsPinnedTop ? AppColors.Primary : AppColors.SurfaceHighlight;
        _btnPinTop.Text = state.IsPinnedTop ? "📌 Đã ghim" : "📌 Ghim";

        _statusBadge.BadgeText = state.IsClipboardListening ? "ACTIVE" : "PAUSED";
        _statusBadge.BadgeColor = state.IsClipboardListening ? AppColors.Success : AppColors.Danger;

        if (state.IsDashboard)
        {
            _btnBackHome.Visible = false;
            _lblTitle.Location = new Point(10, 8);
            _lblCtvHeader.Location = new Point(12, 30);
        }
        else
        {
            _btnBackHome.Visible = true;
            _btnBackHome.Location = new Point(10, 12);
            _lblTitle.Location = new Point(108, 8);
            _lblCtvHeader.Location = new Point(110, 30);
        }
    }
}
