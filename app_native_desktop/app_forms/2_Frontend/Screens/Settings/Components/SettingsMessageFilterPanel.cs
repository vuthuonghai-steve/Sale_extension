using AppForms.Frontend.Shared.Components;
using AppForms.Frontend.Shared.Theme;
using AppForms.Shared.Models.MessageFilter;

namespace AppForms.Frontend.Screens.Settings.Components;

public class SettingsMessageFilterPanel : Panel
{
    private CheckBox _chkEnableService = null!;
    private CheckBox _chkCommission = null!;
    private CheckBox _chkBrand = null!;
    private CheckBox _chkReplyQuote = null!;
    private CheckBox _chkZaloSticker = null!;
    private CheckBox _chkUnicode = null!;
    private CheckBox _chkUrl = null!;
    private NumericUpDown _numCharLimit = null!;
    private ModernButton _btnSave = null!;

    public event Action<FilterPipelineOptions>? SaveRequested;

    public SettingsMessageFilterPanel()
    {
        InitializeUI();
    }

    private void InitializeUI()
    {
        Padding = new Padding(8, 8, 2, 8);

        var scrollPanel = new SlimScrollPanel { Dock = DockStyle.Fill };

        var cardPanel = new Panel
        {
            Dock = DockStyle.Top,
            Height = 440,
            AutoSize = true,
            AutoSizeMode = AutoSizeMode.GrowAndShrink,
            BackColor = AppColors.SurfaceDark,
            Padding = new Padding(14)
        };

        var lblTitle = new Label
        {
            Text = "🧹 CẤU HÌNH DỊCH VỤ LỌC OS CLIPBOARD",
            Font = AppFonts.SubHeader,
            ForeColor = AppColors.TextPrimary,
            Dock = DockStyle.Top,
            Height = 28
        };

        _chkEnableService = new CheckBox
        {
            Text = "🚀 BẬT TỰ ĐỘNG LỌC CLIPBOARD HỆ ĐIỀU HÀNH (Ctrl+C)",
            Font = AppFonts.BodyBold,
            ForeColor = AppColors.PrimaryHover,
            Dock = DockStyle.Top,
            Height = 32
        };

        var divider = new Panel { Dock = DockStyle.Top, Height = 10 };

        var lblSubFilters = new Label
        {
            Text = "Các quy tắc lọc thành phần được kích hoạt:",
            Font = AppFonts.CaptionBold,
            ForeColor = AppColors.TextSecondary,
            Dock = DockStyle.Top,
            Height = 24
        };

        _chkCommission = CreateFilterCheckBox("🌺 Lọc Hoa Hồng, Phí Môi Giới & Thưởng Sale (Commission)");
        _chkBrand = CreateFilterCheckBox("🏢 Lọc Thương Hiệu Nguồn Hàng Rác (TL House...)");
        _chkReplyQuote = CreateFilterCheckBox("💬 Lọc Header Trích Dẫn Tin Nhắn Cũ (Zalo Quote Stripper)");
        _chkZaloSticker = CreateFilterCheckBox("🏷️ Lọc Sticker Zalo & Thẻ Phân Cách [Hình ảnh], [File]");
        _chkUnicode = CreateFilterCheckBox("🔤 Chuẩn Hóa Unicode Form C & Xóa Ký Tự Vô Hình (BOM, Zero-width)");
        _chkUrl = CreateFilterCheckBox("🔗 Làm Sạch URL Tracking Parameters (utm_*, fbclid...)");

        var pnlCharLimit = new Panel
        {
            Dock = DockStyle.Top,
            Height = 34,
            Padding = new Padding(0, 4, 0, 0)
        };

        var lblCharLimit = new Label
        {
            Text = "Giới hạn ký tự tối đa:",
            Font = AppFonts.Caption,
            ForeColor = AppColors.TextSecondary,
            Location = new Point(0, 6),
            AutoSize = true
        };

        _numCharLimit = new NumericUpDown
        {
            Minimum = 1000,
            Maximum = 10_000_000,
            Increment = 10000,
            Value = 100000,
            Location = new Point(140, 4),
            Width = 120,
            BackColor = AppColors.SurfaceInput,
            ForeColor = AppColors.TextPrimary,
            BorderStyle = BorderStyle.FixedSingle
        };

        pnlCharLimit.Controls.Add(lblCharLimit);
        pnlCharLimit.Controls.Add(_numCharLimit);

        var spacer = new Panel { Dock = DockStyle.Top, Height = 14 };

        _btnSave = new ModernButton
        {
            Text = "💾 LƯU CÀI ĐẶT BỘ LỌC",
            CustomBackColor = AppColors.Primary,
            CustomHoverColor = AppColors.PrimaryHover,
            Font = AppFonts.BodyBold,
            Dock = DockStyle.Top,
            Height = 38
        };
        _btnSave.Click += (_, _) =>
        {
            SaveRequested?.Invoke(GetOptions());
        };

        cardPanel.Controls.Add(_btnSave);
        cardPanel.Controls.Add(spacer);
        cardPanel.Controls.Add(pnlCharLimit);
        cardPanel.Controls.Add(_chkUrl);
        cardPanel.Controls.Add(_chkUnicode);
        cardPanel.Controls.Add(_chkZaloSticker);
        cardPanel.Controls.Add(_chkReplyQuote);
        cardPanel.Controls.Add(_chkBrand);
        cardPanel.Controls.Add(_chkCommission);
        cardPanel.Controls.Add(lblSubFilters);
        cardPanel.Controls.Add(divider);
        cardPanel.Controls.Add(_chkEnableService);
        cardPanel.Controls.Add(lblTitle);

        scrollPanel.Content.Controls.Add(cardPanel);
        Controls.Add(scrollPanel);
    }

    private static CheckBox CreateFilterCheckBox(string text)
    {
        return new CheckBox
        {
            Text = text,
            Font = AppFonts.Body,
            ForeColor = AppColors.TextPrimary,
            Dock = DockStyle.Top,
            Height = 28,
            Checked = true
        };
    }

    public void BindData(FilterPipelineOptions options)
    {
        _chkEnableService.Checked = options.EnableService;
        _chkCommission.Checked = options.EnableCommissionFilter;
        _chkBrand.Checked = options.EnableBrandFilter;
        _chkReplyQuote.Checked = options.EnableReplyQuoteFilter;
        _chkZaloSticker.Checked = options.EnableZaloStickerFilter;
        _chkUnicode.Checked = options.EnableUnicodeSanitizer;
        _chkUrl.Checked = options.EnableUrlSanitizer;
        _numCharLimit.Value = Math.Max(_numCharLimit.Minimum, Math.Min(_numCharLimit.Maximum, options.MaxPayloadCharacterLimit));
    }

    public FilterPipelineOptions GetOptions()
    {
        return new FilterPipelineOptions
        {
            EnableService = _chkEnableService.Checked,
            EnableCommissionFilter = _chkCommission.Checked,
            EnableBrandFilter = _chkBrand.Checked,
            EnableReplyQuoteFilter = _chkReplyQuote.Checked,
            EnableZaloStickerFilter = _chkZaloSticker.Checked,
            EnableUnicodeSanitizer = _chkUnicode.Checked,
            EnableUrlSanitizer = _chkUrl.Checked,
            MaxPayloadCharacterLimit = (int)_numCharLimit.Value
        };
    }

    public void ShowSaveSuccessFeedback()
    {
        _btnSave.Text = "✅ ĐÃ LƯU BỘ LỌC THÀNH CÔNG!";
        _btnSave.CustomBackColor = AppColors.Success;

        var timer = new System.Windows.Forms.Timer { Interval = 1500 };
        timer.Tick += (_, _) =>
        {
            _btnSave.Text = "💾 LƯU CÀI ĐẶT BỘ LỌC";
            _btnSave.CustomBackColor = AppColors.Primary;
            timer.Stop();
            timer.Dispose();
        };
        timer.Start();
    }
}
