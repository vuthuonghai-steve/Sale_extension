using System.Drawing;
using AppForms.Frontend.Screens.Dashboard.Models;
using AppForms.Frontend.Shared.Components;
using AppForms.Frontend.Shared.Theme;
using AppForms.Shared.Enums;

namespace AppForms.Frontend.Screens.Dashboard.Components;

/// <summary>
/// Sub-Component hiển thị danh sách các hộp tính năng hợp nhất (Lối tắt + Công tắc Bật/Tắt chạy ngầm)
/// </summary>
public class UnifiedFeatureCardPanel : Panel
{
    private readonly Label _lblSectionTitle;
    private readonly Panel _cardsContainer;

    public event Action<AppRouteId>? RouteSelected;
    public event Action<string, bool>? ToggleRequested;

    public UnifiedFeatureCardPanel()
    {
        Dock = DockStyle.Top;
        AutoSize = true;
        AutoSizeMode = AutoSizeMode.GrowAndShrink;
        BackColor = Color.Transparent;
        Padding = new Padding(0, 4, 0, 4);

        _lblSectionTitle = new Label
        {
            Text = "⚡ TÍNH NĂNG & DỊCH VỤ NỀN",
            Font = AppFonts.Badge,
            ForeColor = AppColors.TextSecondary,
            AutoSize = true,
            Dock = DockStyle.Top,
            Padding = new Padding(2, 0, 0, 6)
        };

        _cardsContainer = new Panel
        {
            Dock = DockStyle.Top,
            AutoSize = true,
            AutoSizeMode = AutoSizeMode.GrowAndShrink,
            BackColor = Color.Transparent
        };

        Controls.Add(_cardsContainer);
        Controls.Add(_lblSectionTitle);
    }

    public void BindData(IReadOnlyList<DashboardFeatureCardItem> featureCards)
    {
        _cardsContainer.SuspendLayout();
        _cardsContainer.Controls.Clear();

        // Thêm theo thứ tự từ dưới lên khi dùng Dock = DockStyle.Top
        for (int i = featureCards.Count - 1; i >= 0; i--)
        {
            var card = CreateUnifiedCard(featureCards[i]);
            _cardsContainer.Controls.Add(card);
        }

        _cardsContainer.ResumeLayout(true);
    }

    private Control CreateUnifiedCard(DashboardFeatureCardItem item)
    {
        var card = new Panel
        {
            Dock = DockStyle.Top,
            Height = 84,
            BackColor = AppColors.SurfaceDark,
            Margin = new Padding(0, 0, 0, 8),
            Padding = new Padding(10, 8, 10, 8),
            Cursor = Cursors.Hand
        };

        var lblIcon = new Label
        {
            Text = item.IconSymbol,
            Font = new Font("Segoe UI Emoji", 16F, FontStyle.Regular),
            ForeColor = AppColors.TextPrimary,
            Size = new Size(36, 36),
            Location = new Point(8, 14),
            TextAlign = ContentAlignment.MiddleCenter,
            Cursor = Cursors.Hand
        };

        var lblTitle = new Label
        {
            Text = item.DisplayTitle,
            Font = AppFonts.BodyBold,
            ForeColor = AppColors.TextPrimary,
            AutoSize = true,
            Location = new Point(48, 10),
            Cursor = Cursors.Hand
        };

        var lblDesc = new Label
        {
            Text = item.Description,
            Font = AppFonts.Badge,
            ForeColor = AppColors.TextMuted,
            Location = new Point(48, 30),
            Size = new Size(180, 28),
            Cursor = Cursors.Hand
        };

        // Text trạng thái nền
        string statusText;
        Color statusColor;
        if (item.HasBackgroundService)
        {
            if (item.IsRunning)
            {
                var timePart = item.LastActivityTime.HasValue
                    ? $" | {item.LastActivityTime.Value:HH:mm:ss}"
                    : string.Empty;
                statusText = $"🟢 Chạy ngầm: BẬT{timePart}";
                statusColor = AppColors.Success;
            }
            else
            {
                statusText = "⚪ Chạy ngầm: TẮT";
                statusColor = AppColors.TextMuted;
            }
        }
        else
        {
            statusText = "⚙️ Thiết lập hệ thống";
            statusColor = AppColors.PrimaryHover;
        }

        var lblStatus = new Label
        {
            Text = statusText,
            Font = AppFonts.Badge,
            ForeColor = statusColor,
            AutoSize = true,
            Location = new Point(48, 60),
            Cursor = Cursors.Hand
        };

        // Nút hành động góc phải (Toggle hoặc Điều hướng)
        Control actionControl;
        if (item.HasBackgroundService && !string.IsNullOrEmpty(item.AssociatedFeatureId))
        {
            var btnToggle = new ModernButton
            {
                Text = item.IsRunning ? "BẬT 🟢" : "TẮT ⚪",
                Font = AppFonts.Badge,
                Size = new Size(68, 28),
                CustomBackColor = item.IsRunning ? AppColors.Success : AppColors.SurfaceHighlight,
                CustomHoverColor = item.IsRunning ? AppColors.Danger : AppColors.Primary
            };

            btnToggle.Click += (s, e) =>
            {
                ToggleRequested?.Invoke(item.AssociatedFeatureId, !item.IsRunning);
            };

            actionControl = btnToggle;
        }
        else
        {
            var btnOpen = new ModernButton
            {
                Text = "Mở ➔",
                Font = AppFonts.Badge,
                Size = new Size(58, 28),
                CustomBackColor = AppColors.SurfaceHighlight,
                CustomHoverColor = AppColors.Primary
            };

            btnOpen.Click += (s, e) => RouteSelected?.Invoke(item.RouteId);
            actionControl = btnOpen;
        }

        // Đăng ký sự kiện click vào background card để điều hướng
        void OnCardClick(object? s, EventArgs e) => RouteSelected?.Invoke(item.RouteId);

        card.Click += OnCardClick;
        lblIcon.Click += OnCardClick;
        lblTitle.Click += OnCardClick;
        lblDesc.Click += OnCardClick;
        lblStatus.Click += OnCardClick;

        card.Controls.Add(lblIcon);
        card.Controls.Add(lblTitle);
        card.Controls.Add(lblDesc);
        card.Controls.Add(lblStatus);
        card.Controls.Add(actionControl);

        void LayoutCardContent()
        {
            actionControl.Location = new Point(card.Width - actionControl.Width - 10, (card.Height - actionControl.Height) / 2);
            lblDesc.Width = Math.Max(120, card.Width - 140);
        }

        // Căn chỉnh tọa độ ban đầu và lắng nghe khi card resize
        LayoutCardContent();
        card.Resize += (s, e) => LayoutCardContent();

        card.Paint += (s, e) =>
        {
            using var pen = new Pen(item.IsRunning ? AppColors.BorderHighlight : AppColors.BorderSubtle, 1);
            e.Graphics.DrawRectangle(pen, 0, 0, card.Width - 1, card.Height - 1);
        };

        return card;
    }
}
