using System.Drawing;
using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Shared.Components;

/// <summary>
/// Container panel hỗ trợ cuộn nội dung mượt mà với thanh cuộn Slim 6px (SlimVScrollBar).
/// Thay thế hoàn toàn AutoScroll mặc định của WinForms, bảo toàn khả năng render các controls con.
/// </summary>
public class SlimScrollPanel : Panel
{
    private readonly Panel _viewport;
    private readonly Panel _contentPanel;
    private readonly SlimVScrollBar _scrollBar;
    private bool _isUpdatingLayout;

    public Panel Content => _contentPanel;
    public SlimVScrollBar ScrollBar => _scrollBar;

    public SlimScrollPanel()
    {
        DoubleBuffered = true;
        SetStyle(
            ControlStyles.AllPaintingInWmPaint |
            ControlStyles.OptimizedDoubleBuffer |
            ControlStyles.ResizeRedraw |
            ControlStyles.SupportsTransparentBackColor,
            true);

        BackColor = AppColors.BackgroundDark;
        AutoScroll = false;

        _scrollBar = new SlimVScrollBar
        {
            Dock = DockStyle.Right,
            Width = 6,
            Visible = false
        };
        _scrollBar.ValueChanged += (_, _) => ApplyScroll();

        _viewport = new Panel
        {
            Dock = DockStyle.Fill,
            BackColor = AppColors.BackgroundDark,
            AutoScroll = false
        };

        _contentPanel = new Panel
        {
            Location = new Point(0, 0),
            BackColor = AppColors.BackgroundDark,
            AutoScroll = false
        };

        _contentPanel.SizeChanged += (_, _) => UpdateScrollParameters();
        _contentPanel.Layout += (_, _) => UpdateScrollParameters();
        _contentPanel.ControlAdded += (_, e) =>
        {
            if (e.Control != null)
            {
                AttachMouseWheelRecursive(e.Control);
                e.Control.SizeChanged += (_, _) => UpdateScrollParameters();
                e.Control.VisibleChanged += (_, _) => UpdateScrollParameters();
            }
            UpdateScrollParameters();
        };
        _contentPanel.ControlRemoved += (_, _) => UpdateScrollParameters();

        _viewport.Controls.Add(_contentPanel);
        _viewport.Resize += (_, _) => UpdateScrollParameters();

        Controls.Add(_viewport);
        Controls.Add(_scrollBar);

        AttachMouseWheelRecursive(this);
    }

    protected override void OnResize(EventArgs eventargs)
    {
        base.OnResize(eventargs);
        UpdateScrollParameters();
    }

    public void UpdateScrollParameters()
    {
        if (_isUpdatingLayout) return;
        _isUpdatingLayout = true;

        try
        {
            var viewportWidth = Math.Max(0, _viewport.ClientSize.Width);
            var viewportHeight = Math.Max(0, _viewport.ClientSize.Height);

            _contentPanel.Width = viewportWidth;

            // Tính tổng chiều cao thực tế của các control con bên trong _contentPanel
            var maxBottom = 0;
            foreach (Control child in _contentPanel.Controls)
            {
                if (!child.Visible) continue;
                var bottom = child.Bottom + child.Margin.Bottom;
                if (bottom > maxBottom)
                {
                    maxBottom = bottom;
                }
            }

            var calculatedHeight = Math.Max(maxBottom + _contentPanel.Padding.Bottom, viewportHeight);
            if (_contentPanel.Height != calculatedHeight)
            {
                _contentPanel.Height = calculatedHeight;
            }

            var maxScroll = Math.Max(0, calculatedHeight - viewportHeight);

            _scrollBar.LargeChange = Math.Max(1, viewportHeight);
            _scrollBar.SmallChange = 30;
            _scrollBar.Maximum = maxScroll;
            _scrollBar.Visible = maxScroll > 0;

            if (_scrollBar.Value > maxScroll)
            {
                _scrollBar.Value = maxScroll;
            }

            ApplyScroll();
        }
        finally
        {
            _isUpdatingLayout = false;
        }
    }

    private void ApplyScroll()
    {
        var targetY = -_scrollBar.Value;
        if (_contentPanel.Top != targetY)
        {
            _contentPanel.Top = targetY;
        }
    }

    public void ScrollToTop()
    {
        _scrollBar.Value = 0;
    }

    private void AttachMouseWheelRecursive(Control control)
    {
        control.MouseWheel -= OnChildMouseWheel;
        control.MouseWheel += OnChildMouseWheel;

        foreach (Control child in control.Controls)
        {
            AttachMouseWheelRecursive(child);
        }
    }

    private void OnChildMouseWheel(object? sender, MouseEventArgs e)
    {
        if (!_scrollBar.Visible || _scrollBar.Maximum <= 0) return;

        var scrollDelta = -(e.Delta / 120) * 45;
        _scrollBar.Value = Math.Clamp(_scrollBar.Value + scrollDelta, _scrollBar.Minimum, _scrollBar.Maximum);

        if (e is HandledMouseEventArgs handled)
        {
            handled.Handled = true;
        }
    }
}
