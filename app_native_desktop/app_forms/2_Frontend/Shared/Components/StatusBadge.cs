using System.Drawing;
using System.Drawing.Drawing2D;
using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Shared.Components;

public class StatusBadge : Control
{
    private string _badgeText = "ACTIVE";
    private Color _badgeColor = AppColors.Success;

    public string BadgeText
    {
        get => _badgeText;
        set { _badgeText = value; Invalidate(); }
    }

    public Color BadgeColor
    {
        get => _badgeColor;
        set { _badgeColor = value; Invalidate(); }
    }

    public StatusBadge()
    {
        DoubleBuffered = true;
        Size = new Size(75, 22);
        Font = AppFonts.Badge;
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        var g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;

        var rect = new Rectangle(0, 0, Width - 1, Height - 1);

        using (var bgBrush = new SolidBrush(Color.FromArgb(40, _badgeColor)))
        {
            g.FillRoundedRectangle(bgBrush, rect, 8);
        }

        using (var borderPen = new Pen(_badgeColor, 1f))
        {
            g.DrawRoundedRectangle(borderPen, rect, 8);
        }

        TextRenderer.DrawText(
            g,
            _badgeText,
            Font,
            rect,
            _badgeColor,
            TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.SingleLine
        );
    }
}

public static class GraphicsExtensions
{
    public static void FillRoundedRectangle(this Graphics g, Brush brush, Rectangle rect, int radius)
    {
        using var path = CreateRoundedRectanglePath(rect, radius);
        g.FillPath(brush, path);
    }

    public static void DrawRoundedRectangle(this Graphics g, Pen pen, Rectangle rect, int radius)
    {
        using var path = CreateRoundedRectanglePath(rect, radius);
        g.DrawPath(pen, path);
    }

    private static GraphicsPath CreateRoundedRectanglePath(Rectangle rect, int radius)
    {
        var path = new GraphicsPath();
        var d = radius * 2;
        path.AddArc(rect.X, rect.Y, d, d, 180, 90);
        path.AddArc(rect.Right - d, rect.Y, d, d, 270, 90);
        path.AddArc(rect.Right - d, rect.Bottom - d, d, d, 0, 90);
        path.AddArc(rect.X, rect.Bottom - d, d, d, 90, 90);
        path.CloseFigure();
        return path;
    }
}
