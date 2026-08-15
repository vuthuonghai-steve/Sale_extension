using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Screens.Settings.Components;

/// <summary>
/// Sub-Component: Tag/Chip hiển thị mã phòng riêng lẻ kèm nút xóa nhanh [✕]
/// </summary>
public class RoomCodeChip : Panel
{
    private readonly Label _lblCode;
    private readonly Button _btnDelete;
    private readonly string _schemaId;
    private readonly string _code;

    public event Action<string, string>? DeleteClicked; // (schemaId, code)

    public RoomCodeChip(string schemaId, string code)
    {
        _schemaId = schemaId;
        _code = code;

        // Cấu hình kích thước và style của Chip
        var textSize = TextRenderer.MeasureText(code, AppFonts.BodyBold);
        var chipWidth = Math.Max(70, textSize.Width + 38);
        var chipHeight = 28;

        Size = new Size(chipWidth, chipHeight);
        BackColor = AppColors.SurfaceHighlight;
        Margin = new Padding(4, 3, 4, 3);
        Cursor = Cursors.Default;

        _lblCode = new Label
        {
            Text = code,
            Font = AppFonts.BodyBold,
            ForeColor = AppColors.TextPrimary,
            AutoSize = false,
            Location = new Point(8, 4),
            Size = new Size(textSize.Width + 4, 20),
            TextAlign = ContentAlignment.MiddleLeft
        };

        _btnDelete = new Button
        {
            Text = "✕",
            Font = AppFonts.CaptionBold,
            ForeColor = AppColors.Danger,
            BackColor = Color.Transparent,
            FlatStyle = FlatStyle.Flat,
            Size = new Size(20, 20),
            Location = new Point(chipWidth - 24, 4),
            Cursor = Cursors.Hand
        };
        _btnDelete.FlatAppearance.BorderSize = 0;
        _btnDelete.FlatAppearance.MouseOverBackColor = Color.FromArgb(60, 239, 68, 68);
        _btnDelete.Click += (_, _) => DeleteClicked?.Invoke(_schemaId, _code);

        Controls.Add(_lblCode);
        Controls.Add(_btnDelete);

        // Hiệu ứng hover cho Chip
        MouseEnter += (_, _) => BackColor = AppColors.BorderHighlight;
        MouseLeave += (_, _) => BackColor = AppColors.SurfaceHighlight;
        _lblCode.MouseEnter += (_, _) => BackColor = AppColors.BorderHighlight;
        _lblCode.MouseLeave += (_, _) => BackColor = AppColors.SurfaceHighlight;
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        base.OnPaint(e);
        // Vẽ viền nhẹ cho Chip
        using var pen = new Pen(AppColors.BorderSubtle, 1);
        e.Graphics.DrawRectangle(pen, 0, 0, Width - 1, Height - 1);
    }
}
