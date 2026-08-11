using System.Drawing;
using System.Drawing.Drawing2D;
using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Shared.Components;

public class ModernButton : Button
{
    private bool _isHovered;
    private bool _isPressed;
    private Color _customBackColor = AppColors.Primary;
    private Color _customHoverColor = AppColors.PrimaryHover;

    public int CornerRadius { get; set; } = 6;

    public Color CustomBackColor
    {
        get => _customBackColor;
        set { _customBackColor = value; Invalidate(); }
    }

    public Color CustomHoverColor
    {
        get => _customHoverColor;
        set { _customHoverColor = value; Invalidate(); }
    }

    public ModernButton()
    {
        FlatStyle = FlatStyle.Flat;
        FlatAppearance.BorderSize = 0;
        Font = AppFonts.BodyBold;
        ForeColor = AppColors.TextPrimary;
        BackColor = AppColors.Primary;
        Cursor = Cursors.Hand;
        Size = new Size(110, 32);
        DoubleBuffered = true;
    }

    protected override void OnMouseEnter(EventArgs e)
    {
        base.OnMouseEnter(e);
        _isHovered = true;
        Invalidate();
    }

    protected override void OnMouseLeave(EventArgs e)
    {
        base.OnMouseLeave(e);
        _isHovered = false;
        _isPressed = false;
        Invalidate();
    }

    protected override void OnMouseDown(MouseEventArgs mevent)
    {
        base.OnMouseDown(mevent);
        _isPressed = true;
        Invalidate();
    }

    protected override void OnMouseUp(MouseEventArgs mevent)
    {
        base.OnMouseUp(mevent);
        _isPressed = false;
        Invalidate();
    }

    protected override void OnPaint(PaintEventArgs pevent)
    {
        var g = pevent.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;

        var rect = new Rectangle(0, 0, Width - 1, Height - 1);
        var currentBg = _isPressed
            ? AppColors.PrimaryActive
            : _isHovered ? _customHoverColor : _customBackColor;

        if (!Enabled)
        {
            currentBg = AppColors.SurfaceHighlight;
        }

        using var path = CreateRoundedRectanglePath(rect, CornerRadius);
        using var brush = new SolidBrush(currentBg);
        g.FillPath(brush, path);

        var textColor = Enabled ? ForeColor : AppColors.TextMuted;
        TextRenderer.DrawText(
            g,
            Text,
            Font,
            rect,
            textColor,
            TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.SingleLine
        );
    }

    private static GraphicsPath CreateRoundedRectanglePath(Rectangle rect, int radius)
    {
        var path = new GraphicsPath();
        if (radius <= 0)
        {
            path.AddRectangle(rect);
            return path;
        }

        var d = radius * 2;
        path.AddArc(rect.X, rect.Y, d, d, 180, 90);
        path.AddArc(rect.Right - d, rect.Y, d, d, 270, 90);
        path.AddArc(rect.Right - d, rect.Bottom - d, d, d, 0, 90);
        path.AddArc(rect.X, rect.Bottom - d, d, d, 90, 90);
        path.CloseFigure();
        return path;
    }
}
