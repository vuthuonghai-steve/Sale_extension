using System.Drawing;
using AppForms.Frontend.Shared.Theme;
using AppForms.Shared.Models.SpecialMapping;

namespace AppForms.Frontend.Screens.LeadConverter.Components;

/// <summary>
/// Sub-Component hiển thị khối cảnh báo mã phòng đặc biệt đa sàn.
/// Tuân thủ Component-Driven UI: Nhận dữ liệu qua BindData và phát sinh sự kiện tương tác.
/// </summary>
public class SpecialCodeAlertBox : Panel
{
    private SpecialRoomMappingEntity? _currentMapping;

    public event Action<string>? CopyPhoneRequested;
    public event Action<string>? OpenUrlRequested;

    public SpecialCodeAlertBox()
    {
        Dock = DockStyle.Top;
        AutoSize = true;
        AutoSizeMode = AutoSizeMode.GrowAndShrink;
        BackColor = AppColors.SurfaceHighlight;
        Padding = new Padding(12, 10, 12, 10);
        Visible = false;
    }

    public void BindData(SpecialRoomMappingEntity? mapping)
    {
        _currentMapping = mapping;

        if (mapping == null)
        {
            Visible = false;
            Controls.Clear();
            return;
        }

        Visible = true;
        RenderAlert(mapping);
    }

    private void RenderAlert(SpecialRoomMappingEntity mapping)
    {
        SuspendLayout();
        Controls.Clear();

        var container = new Panel
        {
            Dock = DockStyle.Top,
            AutoSize = true,
            AutoSizeMode = AutoSizeMode.GrowAndShrink,
            BackColor = Color.FromArgb(35, 33, 45) // Subtle dark amber highlight
        };

        // 1. Header Banner
        var pnlHeader = new Panel
        {
            Dock = DockStyle.Top,
            Height = 26,
            Padding = new Padding(0, 0, 0, 4)
        };

        var lblTitle = new Label
        {
            Text = $"⚡ MÃ PHÒNG ĐẶC BIỆT (STT: {mapping.Stt}{(string.IsNullOrEmpty(mapping.BuildingNo) ? "" : $" | Số: {mapping.BuildingNo}")})",
            Font = AppFonts.SubHeader,
            ForeColor = AppColors.Warning,
            Dock = DockStyle.Fill,
            TextAlign = ContentAlignment.MiddleLeft
        };
        pnlHeader.Controls.Add(lblTitle);

        // 2. Thông tin Chủ / Quản lý & SĐT
        var pnlManager = new Panel
        {
            Dock = DockStyle.Top,
            Height = 28,
            Padding = new Padding(0, 2, 0, 2)
        };

        var managerText = $"👤 Chủ/QL: {(string.IsNullOrEmpty(mapping.ManagerName) ? "Chưa rõ" : mapping.ManagerName)}" +
                          (string.IsNullOrEmpty(mapping.Phone) ? "" : $"  -  📞 SĐT: {mapping.Phone}") +
                          (string.IsNullOrEmpty(mapping.Commission) ? "" : $"  -  💰 Hoa hồng: {mapping.Commission}");

        var lblManager = new Label
        {
            Text = managerText,
            Font = AppFonts.Body,
            ForeColor = AppColors.TextPrimary,
            Dock = DockStyle.Left,
            AutoSize = true,
            TextAlign = ContentAlignment.MiddleLeft
        };
        pnlManager.Controls.Add(lblManager);

        if (!string.IsNullOrEmpty(mapping.Phone))
        {
            var btnCopyPhone = new Button
            {
                Text = "📋 Sao chép SĐT",
                Font = AppFonts.Caption,
                ForeColor = AppColors.TextPrimary,
                BackColor = AppColors.SurfaceInput,
                FlatStyle = FlatStyle.Flat,
                Height = 24,
                Width = 105,
                Dock = DockStyle.Right,
                Cursor = Cursors.Hand
            };
            btnCopyPhone.FlatAppearance.BorderColor = AppColors.BorderSubtle;
            btnCopyPhone.Click += (_, _) =>
            {
                CopyPhoneRequested?.Invoke(mapping.Phone);
                btnCopyPhone.Text = "✓ Đã sao chép!";
            };
            pnlManager.Controls.Add(btnCopyPhone);
        }

        // 3. Danh sách mã các sàn tương ứng (Cross-Platform Codes)
        var pnlCodes = new FlowLayoutPanel
        {
            Dock = DockStyle.Top,
            AutoSize = true,
            AutoSizeMode = AutoSizeMode.GrowAndShrink,
            Padding = new Padding(0, 4, 0, 4),
            WrapContents = true
        };

        var lblCodesTitle = new Label
        {
            Text = "🏷️ Mã các sàn:",
            Font = AppFonts.Caption,
            ForeColor = AppColors.TextSecondary,
            AutoSize = true,
            Margin = new Padding(0, 4, 8, 4)
        };
        pnlCodes.Controls.Add(lblCodesTitle);

        if (mapping.PlatformCodes.Count > 0)
        {
            foreach (var (platform, code) in mapping.PlatformCodes)
            {
                var badge = new Label
                {
                    Text = $"{platform}: {code}",
                    Font = AppFonts.Caption,
                    ForeColor = AppColors.PrimaryHover,
                    BackColor = AppColors.SurfaceInput,
                    BorderStyle = BorderStyle.FixedSingle,
                    AutoSize = true,
                    Padding = new Padding(6, 2, 6, 2),
                    Margin = new Padding(2, 2, 6, 2)
                };
                pnlCodes.Controls.Add(badge);
            }
        }
        else
        {
            var lblNoCodes = new Label
            {
                Text = "(Chưa có thông tin mã sàn chéo)",
                Font = AppFonts.Caption,
                ForeColor = AppColors.TextMuted,
                AutoSize = true
            };
            pnlCodes.Controls.Add(lblNoCodes);
        }

        // 4. Link bảng hàng phòng trống (nếu có)
        Panel? pnlLink = null;
        if (!string.IsNullOrEmpty(mapping.SheetLink))
        {
            pnlLink = new Panel
            {
                Dock = DockStyle.Top,
                Height = 28,
                Padding = new Padding(0, 2, 0, 2)
            };

            var btnOpenSheet = new Button
            {
                Text = $"🔗 Mở bảng hàng: {Truncate(mapping.SheetLink, 60)}",
                Font = AppFonts.Caption,
                ForeColor = AppColors.Info,
                BackColor = AppColors.SurfaceInput,
                FlatStyle = FlatStyle.Flat,
                Dock = DockStyle.Left,
                AutoSize = true,
                Cursor = Cursors.Hand
            };
            btnOpenSheet.FlatAppearance.BorderColor = AppColors.BorderSubtle;
            btnOpenSheet.Click += (_, _) =>
            {
                OpenUrlRequested?.Invoke(mapping.SheetLink);
            };
            pnlLink.Controls.Add(btnOpenSheet);
        }

        // Thêm theo Z-order Dock Top từ dưới lên trên
        if (pnlLink != null) container.Controls.Add(pnlLink);
        container.Controls.Add(pnlCodes);
        container.Controls.Add(pnlManager);
        container.Controls.Add(pnlHeader);

        Controls.Add(container);
        ResumeLayout();
    }

    private static string Truncate(string str, int maxLength)
    {
        if (string.IsNullOrEmpty(str)) return string.Empty;
        return str.Length <= maxLength ? str : str.Substring(0, maxLength) + "...";
    }
}
