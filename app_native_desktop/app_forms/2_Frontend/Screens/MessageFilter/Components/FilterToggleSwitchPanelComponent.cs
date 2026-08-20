using AppForms.Frontend.Shared.Components;
using AppForms.Frontend.Shared.Theme;
using AppForms.Shared.Models.MessageFilter;

namespace AppForms.Frontend.Screens.MessageFilter.Components;

public class FilterToggleSwitchPanelComponent : Panel
{
    private StatusBadge _statusBadge = null!;
    private ModernButton _btnToggleService = null!;
    private CheckBox _chkCommission = null!;
    private CheckBox _chkBrand = null!;
    private CheckBox _chkQuote = null!;
    private CheckBox _chkSticker = null!;
    private CheckBox _chkUnicode = null!;
    private CheckBox _chkUrl = null!;

    private FilterPipelineOptions _currentOptions = new();
    private bool _isBinding;

    public event Action<bool>? ServiceToggled;
    public event Action<FilterPipelineOptions>? OptionsChanged;

    public FilterToggleSwitchPanelComponent()
    {
        InitializeUI();
    }

    private void InitializeUI()
    {
        Dock = DockStyle.Top;
        Height = 126;
        BackColor = AppColors.SurfaceDark;
        Padding = new Padding(10, 8, 10, 8);

        // Header Top Row
        var topRow = new Panel { Dock = DockStyle.Top, Height = 34, BackColor = Color.Transparent };

        var lblHeader = new Label
        {
            Text = "⚡ TÌNH TRẠNG BỘ LỌC OS CLIPBOARD",
            Font = AppFonts.CaptionBold,
            ForeColor = AppColors.TextPrimary,
            Location = new Point(0, 7),
            AutoSize = true
        };

        _statusBadge = new StatusBadge
        {
            Location = new Point(lblHeader.Right + 12, 6),
            BadgeText = "ACTIVE",
            BadgeColor = AppColors.Success
        };

        _btnToggleService = new ModernButton
        {
            Text = "⏸️ Tạm Dừng Lọc",
            Size = new Size(115, 26),
            Font = AppFonts.Badge,
            CustomBackColor = AppColors.Warning,
            Anchor = AnchorStyles.Top | AnchorStyles.Right,
            Location = new Point(topRow.Width - 120, 4)
        };
        _btnToggleService.Click += (_, _) =>
        {
            _currentOptions.EnableService = !_currentOptions.EnableService;
            ServiceToggled?.Invoke(_currentOptions.EnableService);
        };

        topRow.Controls.Add(lblHeader);
        topRow.Controls.Add(_statusBadge);
        topRow.Controls.Add(_btnToggleService);

        // Sub Filters Quick Toggles (Grid 2 rows x 3 cols)
        var toggleGrid = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            ColumnCount = 3,
            RowCount = 2,
            BackColor = Color.Transparent,
            Padding = new Padding(0, 4, 0, 0)
        };
        toggleGrid.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 33.33f));
        toggleGrid.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 33.33f));
        toggleGrid.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 33.34f));
        toggleGrid.RowStyles.Add(new RowStyle(SizeType.Percent, 50f));
        toggleGrid.RowStyles.Add(new RowStyle(SizeType.Percent, 50f));

        _chkCommission = CreateQuickCheckBox("🌺 Hoa hồng / Bonus");
        _chkBrand = CreateQuickCheckBox("🏢 Thương hiệu TL");
        _chkQuote = CreateQuickCheckBox("💬 Quote Zalo");
        _chkSticker = CreateQuickCheckBox("🏷️ Sticker / Tag");
        _chkUnicode = CreateQuickCheckBox("🔤 Unicode NFC");
        _chkUrl = CreateQuickCheckBox("🔗 URL Tracking");

        toggleGrid.Controls.Add(_chkCommission, 0, 0);
        toggleGrid.Controls.Add(_chkBrand, 1, 0);
        toggleGrid.Controls.Add(_chkQuote, 2, 0);
        toggleGrid.Controls.Add(_chkSticker, 0, 1);
        toggleGrid.Controls.Add(_chkUnicode, 1, 1);
        toggleGrid.Controls.Add(_chkUrl, 2, 1);

        Controls.Add(toggleGrid);
        Controls.Add(topRow);
    }

    private CheckBox CreateQuickCheckBox(string text)
    {
        var chk = new CheckBox
        {
            Text = text,
            Font = AppFonts.Badge,
            ForeColor = AppColors.TextSecondary,
            Dock = DockStyle.Fill,
            Checked = true
        };
        chk.CheckedChanged += (_, _) =>
        {
            if (_isBinding) return;
            _currentOptions.EnableCommissionFilter = _chkCommission.Checked;
            _currentOptions.EnableBrandFilter = _chkBrand.Checked;
            _currentOptions.EnableReplyQuoteFilter = _chkQuote.Checked;
            _currentOptions.EnableZaloStickerFilter = _chkSticker.Checked;
            _currentOptions.EnableUnicodeSanitizer = _chkUnicode.Checked;
            _currentOptions.EnableUrlSanitizer = _chkUrl.Checked;
            OptionsChanged?.Invoke(_currentOptions);
        };
        return chk;
    }

    public void BindData(bool isServiceActive, FilterPipelineOptions options)
    {
        _isBinding = true;
        _currentOptions = options;

        _statusBadge.BadgeText = isServiceActive ? "ACTIVE" : "PAUSED";
        _statusBadge.BadgeColor = isServiceActive ? AppColors.Success : AppColors.Danger;

        _btnToggleService.Text = isServiceActive ? "⏸️ Tạm Dừng Lọc" : "▶️ Bật Lọc OS";
        _btnToggleService.CustomBackColor = isServiceActive ? AppColors.Warning : AppColors.Success;

        _chkCommission.Checked = options.EnableCommissionFilter;
        _chkBrand.Checked = options.EnableBrandFilter;
        _chkQuote.Checked = options.EnableReplyQuoteFilter;
        _chkSticker.Checked = options.EnableZaloStickerFilter;
        _chkUnicode.Checked = options.EnableUnicodeSanitizer;
        _chkUrl.Checked = options.EnableUrlSanitizer;

        _isBinding = false;
    }
}
