using AppForms.Frontend.Shared.Components;
using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Screens.MessageFilter.Components;

public class LiveClipboardPreviewComponent : Panel
{
    private TextBox _txtRawInput = null!;
    private TextBox _txtCleanedOutput = null!;
    private ModernButton _btnCleanManual = null!;
    private ModernButton _btnCopyCleaned = null!;
    private ModernButton _btnClear = null!;
    private Label _lblSummary = null!;
    private readonly System.Windows.Forms.Timer _debounceTimer = new() { Interval = 250 };

    public event Action<string>? CleanRequested;
    public event Action<string>? CopyRequested;

    public LiveClipboardPreviewComponent()
    {
        InitializeUI();
        _debounceTimer.Tick += (_, _) =>
        {
            _debounceTimer.Stop();
            if (!string.IsNullOrEmpty(_txtRawInput.Text))
            {
                CleanRequested?.Invoke(_txtRawInput.Text);
            }
        };
    }

    private void InitializeUI()
    {
        Dock = DockStyle.Fill;
        BackColor = Color.Transparent;
        Padding = new Padding(10, 6, 10, 6);

        var splitContainer = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            RowCount = 2,
            ColumnCount = 1,
            BackColor = Color.Transparent
        };
        splitContainer.RowStyles.Add(new RowStyle(SizeType.Percent, 48f));
        splitContainer.RowStyles.Add(new RowStyle(SizeType.Percent, 52f));

        // 1. Top Panel: Raw Input Box
        var pnlRaw = new Panel { Dock = DockStyle.Fill, BackColor = AppColors.SurfaceDark, Padding = new Padding(8) };
        var pnlRawHeader = new Panel { Dock = DockStyle.Top, Height = 26, BackColor = Color.Transparent };
        var lblRaw = new Label { Text = "📥 VĂN BẢN THÔ (Ctrl+V để thử nghiệm):", Font = AppFonts.CaptionBold, ForeColor = AppColors.TextSecondary, AutoSize = true, Location = new Point(0, 4) };
        _btnClear = new ModernButton { Text = "🗑️ Xóa", Size = new Size(50, 22), Font = AppFonts.Badge, CustomBackColor = AppColors.SurfaceHighlight, Anchor = AnchorStyles.Top | AnchorStyles.Right, Location = new Point(pnlRaw.Width - 60, 2) };
        _btnClear.Click += (_, _) => Clear();

        pnlRawHeader.Controls.Add(lblRaw);
        pnlRawHeader.Controls.Add(_btnClear);

        _txtRawInput = new TextBox
        {
            Multiline = true,
            ScrollBars = ScrollBars.Vertical,
            Dock = DockStyle.Fill,
            BackColor = AppColors.SurfaceInput,
            ForeColor = AppColors.TextPrimary,
            Font = AppFonts.Body,
            BorderStyle = BorderStyle.FixedSingle
        };
        _txtRawInput.TextChanged += (_, _) =>
        {
            _debounceTimer.Stop();
            _debounceTimer.Start();
        };

        pnlRaw.Controls.Add(_txtRawInput);
        pnlRaw.Controls.Add(pnlRawHeader);

        // 2. Bottom Panel: Cleaned Output Box
        var pnlCleaned = new Panel { Dock = DockStyle.Fill, BackColor = AppColors.SurfaceDark, Padding = new Padding(8) };
        var pnlCleanedHeader = new Panel { Dock = DockStyle.Top, Height = 30, BackColor = Color.Transparent };
        var lblCleaned = new Label { Text = "✨ KẾT QUẢ SAU KHI LỌC SẠCH:", Font = AppFonts.CaptionBold, ForeColor = AppColors.Success, AutoSize = true, Location = new Point(0, 6) };

        _btnCleanManual = new ModernButton { Text = "🧹 Lọc Lại", Size = new Size(68, 24), Font = AppFonts.Badge, CustomBackColor = AppColors.Primary, Anchor = AnchorStyles.Top | AnchorStyles.Right, Location = new Point(pnlCleaned.Width - 165, 3) };
        _btnCleanManual.Click += (_, _) => CleanRequested?.Invoke(_txtRawInput.Text);

        _btnCopyCleaned = new ModernButton { Text = "📋 Sao Chép", Size = new Size(85, 24), Font = AppFonts.Badge, CustomBackColor = AppColors.Success, Anchor = AnchorStyles.Top | AnchorStyles.Right, Location = new Point(pnlCleaned.Width - 90, 3) };
        _btnCopyCleaned.Click += (_, _) =>
        {
            if (!string.IsNullOrEmpty(_txtCleanedOutput.Text))
            {
                CopyRequested?.Invoke(_txtCleanedOutput.Text);
                ShowCopyFeedback();
            }
        };

        pnlCleanedHeader.Controls.Add(lblCleaned);
        pnlCleanedHeader.Controls.Add(_btnCleanManual);
        pnlCleanedHeader.Controls.Add(_btnCopyCleaned);

        _txtCleanedOutput = new TextBox
        {
            Multiline = true,
            ScrollBars = ScrollBars.Vertical,
            Dock = DockStyle.Fill,
            BackColor = AppColors.SurfaceInput,
            ForeColor = AppColors.TextPrimary,
            Font = AppFonts.Body,
            BorderStyle = BorderStyle.FixedSingle,
            ReadOnly = true
        };

        _lblSummary = new Label
        {
            Dock = DockStyle.Bottom,
            Height = 20,
            Font = AppFonts.Badge,
            ForeColor = AppColors.TextMuted,
            TextAlign = ContentAlignment.MiddleLeft,
            Text = "Sẵn sàng | Đang lắng nghe clipboard hệ điều hành..."
        };

        pnlCleaned.Controls.Add(_txtCleanedOutput);
        pnlCleaned.Controls.Add(_lblSummary);
        pnlCleaned.Controls.Add(pnlCleanedHeader);

        splitContainer.Controls.Add(pnlRaw, 0, 0);
        splitContainer.Controls.Add(pnlCleaned, 0, 1);
        Controls.Add(splitContainer);
    }

    public void BindData(string raw, string cleaned, bool isModified, long elapsedMs, IReadOnlyList<string> appliedFilters)
    {
        if (!string.Equals(_txtRawInput.Text, raw, StringComparison.Ordinal))
        {
            _txtRawInput.Text = raw;
        }

        _txtCleanedOutput.Text = cleaned;

        if (isModified)
        {
            var filtersText = appliedFilters.Count > 0 ? string.Join(", ", appliedFilters) : "Làm sạch";
            _lblSummary.Text = $"✅ Đã lọc ({filtersText}) | Gốc: {raw.Length} ký tự ➔ Sạch: {cleaned.Length} ký tự | {elapsedMs}ms";
            _lblSummary.ForeColor = AppColors.Success;
        }
        else
        {
            _lblSummary.Text = string.IsNullOrEmpty(raw) ? "Chưa có nội dung" : $"ℹ️ Văn bản gốc đã sạch (không phát hiện thông tin cần lọc) | {elapsedMs}ms";
            _lblSummary.ForeColor = AppColors.TextMuted;
        }
    }

    public void Clear()
    {
        _txtRawInput.Clear();
        _txtCleanedOutput.Clear();
        _lblSummary.Text = "Đã xóa trắng.";
        _lblSummary.ForeColor = AppColors.TextMuted;
    }

    private void ShowCopyFeedback()
    {
        _btnCopyCleaned.Text = "✅ ĐÃ CHÉP!";
        _btnCopyCleaned.CustomBackColor = AppColors.PrimaryHover;

        var timer = new System.Windows.Forms.Timer { Interval = 1200 };
        timer.Tick += (_, _) =>
        {
            _btnCopyCleaned.Text = "📋 Sao Chép";
            _btnCopyCleaned.CustomBackColor = AppColors.Success;
            timer.Stop();
            timer.Dispose();
        };
        timer.Start();
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _debounceTimer.Stop();
            _debounceTimer.Dispose();
        }
        base.Dispose(disposing);
    }
}
