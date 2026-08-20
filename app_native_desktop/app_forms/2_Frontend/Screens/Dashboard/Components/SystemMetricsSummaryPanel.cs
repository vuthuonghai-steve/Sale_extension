using System.Drawing;
using AppForms.Frontend.Screens.Dashboard.Models;
using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Screens.Dashboard.Components;

/// <summary>
/// Sub-Component hiển thị thẻ tóm tắt thông tin CTV, hệ thống và tình trạng dịch vụ (Responsive Sidepanel)
/// </summary>
public class SystemMetricsSummaryPanel : Panel
{
    private readonly Label _lblGreeting;
    private readonly Label _lblCtvInfo;
    private readonly Label _lblMetrics;
    private readonly Label _lblStatusSummary;

    public SystemMetricsSummaryPanel()
    {
        Dock = DockStyle.Top;
        AutoSize = true;
        AutoSizeMode = AutoSizeMode.GrowAndShrink;
        BackColor = AppColors.SurfaceDark;
        Padding = new Padding(12, 10, 12, 10);
        Margin = new Padding(0, 0, 0, 10);

        var titleHeader = new Label
        {
            Text = "📊 TRUNG TÂM ĐIỀU HÀNH",
            Font = AppFonts.Badge,
            ForeColor = AppColors.PrimaryHover,
            AutoSize = true,
            Location = new Point(12, 8)
        };

        _lblGreeting = new Label
        {
            Text = "Xin chào,",
            Font = AppFonts.Caption,
            ForeColor = AppColors.TextSecondary,
            AutoSize = true,
            Location = new Point(12, 26)
        };

        _lblCtvInfo = new Label
        {
            Text = "👤 CTV: ...",
            Font = AppFonts.Header,
            ForeColor = AppColors.TextPrimary,
            AutoSize = true,
            Location = new Point(12, 42)
        };

        _lblMetrics = new Label
        {
            Text = "🏢 0 mã phòng | 📦 v1.0.0",
            Font = AppFonts.Caption,
            ForeColor = AppColors.TextSecondary,
            AutoSize = true,
            Location = new Point(12, 68)
        };

        _lblStatusSummary = new Label
        {
            Text = "⚪ Trạng thái: Đang tải...",
            Font = AppFonts.CaptionBold,
            ForeColor = AppColors.Success,
            AutoSize = true,
            Location = new Point(12, 88)
        };

        Controls.Add(titleHeader);
        Controls.Add(_lblGreeting);
        Controls.Add(_lblCtvInfo);
        Controls.Add(_lblMetrics);
        Controls.Add(_lblStatusSummary);
    }

    public void BindData(DashboardFormModel model)
    {
        _lblCtvInfo.Text = $"👤 {model.CtvName}";
        _lblMetrics.Text = $"🏢 {model.TotalRoomsCount} mã phòng | 📦 v{model.AppVersion}";
        _lblStatusSummary.Text = model.StatusSummary;
        _lblStatusSummary.ForeColor = model.RunningServicesCount > 0
            ? AppColors.Success
            : AppColors.TextMuted;
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        base.OnPaint(e);
        using var pen = new Pen(AppColors.BorderSubtle, 1);
        e.Graphics.DrawRectangle(pen, 0, 0, Width - 1, Height - 1);
    }
}
