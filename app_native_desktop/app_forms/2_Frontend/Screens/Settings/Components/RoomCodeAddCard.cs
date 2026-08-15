using AppForms.Frontend.Shared.Components;
using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Screens.Settings.Components;

/// <summary>
/// Sub-Component: Card nhập và thêm mã mới vào kho
/// </summary>
public class RoomCodeAddCard : Panel
{
    private TextBox _txtNewCodes = null!;
    private ModernButton _btnAddCodes = null!;

    public event Action<string>? AddCodesRequested; // (rawInput)

    public RoomCodeAddCard()
    {
        InitializeUI();
    }

    private void InitializeUI()
    {
        Dock = DockStyle.Top;
        Height = 125;
        BackColor = AppColors.SurfaceDark;
        Padding = new Padding(12);
        Margin = new Padding(0, 0, 0, 8);

        var lblAddTitle = new Label
        {
            Text = "➕ Thêm mã mới vào sàn đang chọn:",
            Font = AppFonts.SubHeader,
            ForeColor = AppColors.TextPrimary,
            Dock = DockStyle.Top,
            Height = 22
        };

        var lblAddHint = new Label
        {
            Text = "(Nhập một hoặc nhiều mã cách nhau bằng dấu phẩy ',' hoặc xuống dòng)",
            Font = AppFonts.Caption,
            ForeColor = AppColors.TextMuted,
            Dock = DockStyle.Top,
            Height = 18
        };

        _txtNewCodes = new TextBox
        {
            Dock = DockStyle.Top,
            Height = 26,
            Font = AppFonts.BodyBold,
            BackColor = AppColors.SurfaceInput,
            ForeColor = AppColors.TextPrimary,
            BorderStyle = BorderStyle.FixedSingle,
            PlaceholderText = "Ví dụ: 512, 515, A102 hoặc Mn99"
        };
        _txtNewCodes.KeyDown += (s, e) =>
        {
            if (e.KeyCode == Keys.Enter)
            {
                e.SuppressKeyPress = true;
                TriggerAdd();
            }
        };

        var spacerAdd = new Panel { Dock = DockStyle.Top, Height = 8 };

        _btnAddCodes = new ModernButton
        {
            Text = "➕ THÊM MÃ VÀO KHO",
            CustomBackColor = AppColors.Primary,
            CustomHoverColor = AppColors.PrimaryHover,
            Font = AppFonts.BodyBold,
            Dock = DockStyle.Top,
            Height = 32
        };
        _btnAddCodes.Click += (_, _) => TriggerAdd();

        Controls.Add(_btnAddCodes);
        Controls.Add(spacerAdd);
        Controls.Add(_txtNewCodes);
        Controls.Add(lblAddHint);
        Controls.Add(lblAddTitle);
    }

    private void TriggerAdd()
    {
        var input = _txtNewCodes.Text.Trim();
        if (!string.IsNullOrWhiteSpace(input))
        {
            AddCodesRequested?.Invoke(input);
            _txtNewCodes.Text = string.Empty;
        }
    }

    public void ClearInput()
    {
        _txtNewCodes.Text = string.Empty;
    }
}
