using System;
using System.Collections.Generic;
using System.Drawing;
using System.Windows.Forms;
using AppForms.Frontend.Screens.HotkeyManager.Models;
using AppForms.Frontend.Shared.Components;
using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Screens.HotkeyManager.Components;

/// <summary>
/// Sub-Component hiển thị danh sách các thẻ phím tắt (Hotkey Cards) với khả năng bật/tắt và test từng phím
/// </summary>
public class HotkeyListPanel : Panel
{
    private readonly SlimScrollPanel _scrollPanel;
    private readonly Panel _cardContainer;

    public event Action<string>? HotkeyToggled;
    public event Action<string>? HotkeyTestRequested;

    public HotkeyListPanel()
    {
        Dock = DockStyle.Fill;
        BackColor = AppColors.BackgroundDark;
        Padding = new Padding(0, 8, 0, 0);

        _scrollPanel = new SlimScrollPanel { Dock = DockStyle.Fill };
        _cardContainer = new Panel
        {
            Dock = DockStyle.Top,
            AutoSize = true,
            AutoSizeMode = AutoSizeMode.GrowAndShrink,
            BackColor = AppColors.BackgroundDark
        };

        _scrollPanel.Content.Controls.Add(_cardContainer);
        Controls.Add(_scrollPanel);
    }

    public void BindItems(IReadOnlyList<HotkeyItemViewModel> items, bool isGlobalListening)
    {
        _cardContainer.SuspendLayout();
        while (_cardContainer.Controls.Count > 0)
        {
            var ctrl = _cardContainer.Controls[0];
            _cardContainer.Controls.RemoveAt(0);
            ctrl.Dispose();
        }

        if (items.Count == 0)
        {
            var lblEmpty = new Label
            {
                Text = "Chưa có phím tắt nào được đăng ký trong hệ thống.",
                Font = AppFonts.Body,
                ForeColor = AppColors.TextMuted,
                Dock = DockStyle.Top,
                Height = 60,
                TextAlign = ContentAlignment.MiddleCenter
            };
            _cardContainer.Controls.Add(lblEmpty);
            _cardContainer.ResumeLayout(true);
            return;
        }

        // Render card từ dưới lên trên (Dock Top Z-order)
        for (int i = items.Count - 1; i >= 0; i--)
        {
            var item = items[i];
            var card = CreateHotkeyCard(item, isGlobalListening);
            _cardContainer.Controls.Add(card);
        }

        _cardContainer.ResumeLayout(true);
    }

    private Panel CreateHotkeyCard(HotkeyItemViewModel item, bool isGlobalListening)
    {
        var isEffectivelyActive = item.IsEnabled && isGlobalListening;

        var card = new Panel
        {
            Dock = DockStyle.Top,
            Height = 85,
            BackColor = AppColors.SurfaceInput,
            Margin = new Padding(0, 0, 0, 8),
            Padding = new Padding(12, 10, 12, 10)
        };

        var lblName = new Label
        {
            Text = item.Name,
            Font = AppFonts.BodyBold,
            ForeColor = isEffectivelyActive ? AppColors.TextPrimary : AppColors.TextMuted,
            AutoSize = true,
            Location = new Point(12, 10)
        };

        var lblBadge = new Label
        {
            Text = $" [ {item.KeyCombinationText} ] ",
            Font = AppFonts.CaptionBold,
            ForeColor = isEffectivelyActive ? AppColors.PrimaryHover : AppColors.TextMuted,
            BackColor = AppColors.SurfaceHighlight,
            AutoSize = true,
            Padding = new Padding(4, 2, 4, 2),
            Location = new Point(lblName.Right + 8, 8)
        };

        var lblDesc = new Label
        {
            Text = item.Description,
            Font = AppFonts.Caption,
            ForeColor = isEffectivelyActive ? AppColors.TextSecondary : AppColors.TextMuted,
            Location = new Point(12, 34),
            Size = new Size(220, 42),
            AutoEllipsis = true
        };

        var btnTest = new ModernButton
        {
            Text = "⚡ Thử",
            Font = AppFonts.CaptionBold,
            Size = new Size(58, 28),
            CustomBackColor = AppColors.SurfaceHighlight,
            Anchor = AnchorStyles.Top | AnchorStyles.Right
        };
        btnTest.Location = new Point(card.Width - 145, 26);
        btnTest.Click += (_, _) => HotkeyTestRequested?.Invoke(item.Id);

        var btnToggle = new ModernButton
        {
            Text = item.IsEnabled ? "🟢 BẬT" : "⚪ TẮT",
            Font = AppFonts.CaptionBold,
            Size = new Size(68, 28),
            CustomBackColor = item.IsEnabled ? AppColors.Success : AppColors.SurfaceDark,
            Anchor = AnchorStyles.Top | AnchorStyles.Right
        };
        btnToggle.Location = new Point(card.Width - 80, 26);
        btnToggle.Click += (_, _) => HotkeyToggled?.Invoke(item.Id);

        card.Controls.Add(lblName);
        card.Controls.Add(lblBadge);
        card.Controls.Add(lblDesc);
        card.Controls.Add(btnTest);
        card.Controls.Add(btnToggle);

        card.Resize += (_, _) =>
        {
            btnToggle.Location = new Point(card.Width - btnToggle.Width - 12, 26);
            btnTest.Location = new Point(btnToggle.Left - btnTest.Width - 6, 26);
            lblDesc.Width = Math.Max(180, btnTest.Left - 20);
        };

        return card;
    }
}
