using System.Drawing;
using System.Drawing.Drawing2D;
using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Shared.Components;

/// <summary>
/// Custom Slim Vertical Scrollbar for Modern Dark UI
/// Rộng 6px, tự động bo góc pill, hỗ trợ kéo thả và hiệu ứng hover đổi màu
/// </summary>
public class SlimVScrollBar : Control
{
    private int _minimum = 0;
    private int _maximum = 100;
    private int _value = 0;
    private int _largeChange = 10;
    private int _smallChange = 1;

    private bool _isHovered = false;
    private bool _isDragging = false;
    private int _dragStartY = 0;
    private int _dragStartValue = 0;

    public event EventHandler? ValueChanged;
    public event ScrollEventHandler? Scroll;

    public int Minimum
    {
        get => _minimum;
        set
        {
            if (_minimum != value)
            {
                _minimum = value;
                if (_maximum < _minimum) _maximum = _minimum;
                Value = Math.Clamp(_value, _minimum, _maximum);
                Invalidate();
            }
        }
    }

    public int Maximum
    {
        get => _maximum;
        set
        {
            if (_maximum != value)
            {
                _maximum = Math.Max(_minimum, value);
                Value = Math.Clamp(_value, _minimum, _maximum);
                Invalidate();
            }
        }
    }

    public int Value
    {
        get => _value;
        set
        {
            var clamped = Math.Clamp(value, _minimum, _maximum);
            if (_value != clamped)
            {
                var oldValue = _value;
                _value = clamped;
                ValueChanged?.Invoke(this, EventArgs.Empty);
                Scroll?.Invoke(this, new ScrollEventArgs(ScrollEventType.ThumbPosition, oldValue, _value, ScrollOrientation.VerticalScroll));
                Invalidate();
            }
        }
    }

    public int LargeChange
    {
        get => _largeChange;
        set
        {
            _largeChange = Math.Max(1, value);
            Invalidate();
        }
    }

    public int SmallChange
    {
        get => _smallChange;
        set => _smallChange = Math.Max(1, value);
    }

    public Color ThumbColor { get; set; } = AppColors.BorderHighlight;
    public Color ThumbHoverColor { get; set; } = AppColors.Primary;
    public Color TrackColor { get; set; } = Color.Transparent;

    public SlimVScrollBar()
    {
        SetStyle(
            ControlStyles.AllPaintingInWmPaint |
            ControlStyles.OptimizedDoubleBuffer |
            ControlStyles.UserPaint |
            ControlStyles.ResizeRedraw |
            ControlStyles.SupportsTransparentBackColor,
            true);

        Width = 6;
        BackColor = Color.Transparent;
        Cursor = Cursors.Default;
    }

    private Rectangle GetThumbRectangle()
    {
        var trackHeight = ClientRectangle.Height;
        var range = _maximum - _minimum;
        if (range <= 0 || trackHeight <= 0) return Rectangle.Empty;

        var totalSpan = range + _largeChange;
        var thumbHeight = Math.Max(24, (int)((float)_largeChange / totalSpan * trackHeight));
        if (thumbHeight > trackHeight) thumbHeight = trackHeight;

        var availableTravel = trackHeight - thumbHeight;
        var thumbTop = availableTravel > 0
            ? (int)((float)(_value - _minimum) / range * availableTravel)
            : 0;

        return new Rectangle(0, thumbTop, Width, thumbHeight);
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        base.OnPaint(e);

        var g = e.Graphics;
        g.SmoothingMode = SmoothingMode.AntiAlias;

        if (TrackColor != Color.Transparent)
        {
            using var trackBrush = new SolidBrush(TrackColor);
            g.FillRectangle(trackBrush, ClientRectangle);
        }

        var range = _maximum - _minimum;
        if (range <= 0) return;

        var thumbRect = GetThumbRectangle();
        if (thumbRect.IsEmpty || thumbRect.Height <= 0) return;

        var activeColor = (_isDragging || _isHovered) ? ThumbHoverColor : ThumbColor;
        using var thumbBrush = new SolidBrush(activeColor);

        var radius = Math.Min(thumbRect.Width / 2, 3);
        using var path = CreateRoundedRectangle(thumbRect, radius);
        g.FillPath(thumbBrush, path);
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
        Invalidate();
    }

    protected override void OnMouseDown(MouseEventArgs e)
    {
        base.OnMouseDown(e);

        if (e.Button != MouseButtons.Left) return;

        var thumbRect = GetThumbRectangle();
        if (thumbRect.Contains(e.Location))
        {
            _isDragging = true;
            _dragStartY = e.Y;
            _dragStartValue = _value;
            Invalidate();
        }
        else
        {
            if (e.Y < thumbRect.Top)
            {
                Value = Math.Max(_minimum, _value - _largeChange);
            }
            else if (e.Y > thumbRect.Bottom)
            {
                Value = Math.Min(_maximum, _value + _largeChange);
            }
        }
    }

    protected override void OnMouseMove(MouseEventArgs e)
    {
        base.OnMouseMove(e);

        if (_isDragging)
        {
            var trackHeight = ClientRectangle.Height;
            var thumbRect = GetThumbRectangle();
            var availableTravel = trackHeight - thumbRect.Height;
            var range = _maximum - _minimum;

            if (availableTravel > 0 && range > 0)
            {
                var deltaY = e.Y - _dragStartY;
                var deltaValue = (int)((float)deltaY / availableTravel * range);
                Value = Math.Clamp(_dragStartValue + deltaValue, _minimum, _maximum);
            }
        }
    }

    protected override void OnMouseUp(MouseEventArgs e)
    {
        base.OnMouseUp(e);
        if (_isDragging)
        {
            _isDragging = false;
            Invalidate();
        }
    }

    protected override void OnMouseWheel(MouseEventArgs e)
    {
        base.OnMouseWheel(e);
        var scrollLines = SystemInformation.MouseWheelScrollLines;
        var delta = (e.Delta / 120) * _smallChange * (scrollLines > 0 ? scrollLines : 3);
        Value -= delta;
    }

    private static GraphicsPath CreateRoundedRectangle(Rectangle rect, int radius)
    {
        var path = new GraphicsPath();
        if (rect.Width <= 0 || rect.Height <= 0) return path;

        var diameter = radius * 2;
        var arc = new Rectangle(rect.Location, new Size(diameter, diameter));

        if (radius == 0 || diameter > rect.Width || diameter > rect.Height)
        {
            path.AddRectangle(rect);
            return path;
        }

        path.AddArc(arc, 180, 90);
        arc.X = rect.Right - diameter;
        path.AddArc(arc, 270, 90);
        arc.Y = rect.Bottom - diameter;
        path.AddArc(arc, 0, 90);
        arc.X = rect.Left;
        path.AddArc(arc, 90, 90);
        path.CloseFigure();
        return path;
    }
}
