using AppForms.Frontend.Shared.Components;
using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Screens.LeadConverter.Components;

public class RawInputBox : Panel
{
    private TextBox _txtRawInput = null!;

    public event Action<string>? RawInputChanged;
    public event Action? ClearRequested;

    public RawInputBox()
    {
        Dock = DockStyle.Top;
        Height = 160;
        BackColor = AppColors.SurfaceDark;
        Padding = new Padding(8, 4, 8, 8);

        InitializeLayout();
    }

    private void InitializeLayout()
    {
        var lblHeader = new Label
        {
            Text = "📥 DỮ LIỆU ĐẦU VÀO (RAW INPUT)",
            Font = AppFonts.SubHeader,
            ForeColor = AppColors.TextSecondary,
            Dock = DockStyle.Top,
            Height = 24
        };

        var topToolbar = new Panel { Dock = DockStyle.Top, Height = 34 };
        var btnPaste = new ModernButton
        {
            Text = "📋 Dán Clipboard",
            CustomBackColor = AppColors.Primary,
            Size = new Size(110, 26),
            Font = AppFonts.CaptionBold,
            Location = new Point(0, 2)
        };
        btnPaste.Click += (_, _) =>
        {
            if (Clipboard.ContainsText())
            {
                _txtRawInput.Text = Clipboard.GetText();
                RawInputChanged?.Invoke(_txtRawInput.Text);
            }
        };

        var btnClear = new ModernButton
        {
            Text = "🗑️ Xóa",
            CustomBackColor = AppColors.SurfaceHighlight,
            CustomHoverColor = AppColors.BorderHighlight,
            Size = new Size(60, 26),
            Font = AppFonts.Caption,
            Location = new Point(btnPaste.Right + 6, 2)
        };
        btnClear.Click += (_, _) =>
        {
            _txtRawInput.Clear();
            ClearRequested?.Invoke();
        };

        topToolbar.Controls.Add(btnPaste);
        topToolbar.Controls.Add(btnClear);

        _txtRawInput = new TextBox
        {
            Dock = DockStyle.Fill,
            Multiline = true,
            ScrollBars = ScrollBars.Vertical,
            BackColor = AppColors.SurfaceInput,
            ForeColor = AppColors.TextPrimary,
            BorderStyle = BorderStyle.FixedSingle,
            Font = AppFonts.Monospace,
            PlaceholderText = "Dán tin nhắn Zalo / Facebook / Ghi chú vào đây..."
        };
        _txtRawInput.TextChanged += (_, _) => RawInputChanged?.Invoke(_txtRawInput.Text);

        Controls.Add(_txtRawInput);
        Controls.Add(topToolbar);
        Controls.Add(lblHeader);
    }

    public void SetText(string text)
    {
        _txtRawInput.Text = text;
    }

    public string GetText() => _txtRawInput.Text;

    public void Clear()
    {
        _txtRawInput.Clear();
    }
}
