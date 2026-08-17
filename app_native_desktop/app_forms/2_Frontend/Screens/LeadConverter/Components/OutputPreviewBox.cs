using System.Drawing;
using AppForms.Frontend.Shared.Components;
using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Screens.LeadConverter.Components;

public class OutputPreviewBox : Panel
{
    private TextBox _txtOutput = null!;
    private ModernButton _btnCopy = null!;

    public event Action? CopyRequested;

    public OutputPreviewBox()
    {
        Dock = DockStyle.Top;
        Height = 220;
        BackColor = AppColors.SurfaceDark;
        Padding = new Padding(8, 4, 8, 8);

        InitializeLayout();
    }

    private void InitializeLayout()
    {
        var lblHeader = new Label
        {
            Text = "📤 KẾT QUẢ ĐỊNH DẠNG (OUTPUT)",
            Font = AppFonts.SubHeader,
            ForeColor = AppColors.TextSecondary,
            Dock = DockStyle.Top,
            Height = 24
        };

        var bottomAction = new Panel
        {
            Dock = DockStyle.Bottom,
            Height = 42,
            Padding = new Padding(0, 6, 0, 0)
        };

        _btnCopy = new ModernButton
        {
            Text = "📋 SAO CHÉP TIN NHẮN",
            CustomBackColor = AppColors.Success,
            CustomHoverColor = Color.FromArgb(22, 163, 74),
            Font = AppFonts.BodyBold,
            Dock = DockStyle.Fill
        };
        _btnCopy.Click += (_, _) =>
        {
            CopyRequested?.Invoke();
        };
        bottomAction.Controls.Add(_btnCopy);

        _txtOutput = new TextBox
        {
            Dock = DockStyle.Fill,
            Multiline = true,
            ScrollBars = ScrollBars.Vertical,
            BackColor = AppColors.SurfaceInput,
            ForeColor = AppColors.TextPrimary,
            BorderStyle = BorderStyle.FixedSingle,
            Font = AppFonts.Monospace,
            PlaceholderText = "Kết quả định dạng sẽ hiển thị tại đây..."
        };

        Controls.Add(_txtOutput);
        Controls.Add(bottomAction);
        Controls.Add(lblHeader);
    }

    public void SetOutputText(string text)
    {
        _txtOutput.Text = text;
        if (string.IsNullOrWhiteSpace(text) || text.StartsWith("⚠️"))
        {
            _txtOutput.ForeColor = text.StartsWith("⚠️") ? AppColors.Warning : AppColors.TextSecondary;
            _btnCopy.Enabled = false;
        }
        else
        {
            _txtOutput.ForeColor = AppColors.TextPrimary;
            _btnCopy.Enabled = true;
        }
    }

    public string GetOutputText() => _txtOutput.Text;

    public void ShowCopySuccess()
    {
        _btnCopy.Text = "✅ ĐÃ SAO CHÉP THÀNH CÔNG!";
        _btnCopy.CustomBackColor = Color.FromArgb(16, 185, 129);

        var timer = new System.Windows.Forms.Timer { Interval = 1500 };
        timer.Tick += (_, _) =>
        {
            _btnCopy.Text = "📋 SAO CHÉP TIN NHẮN";
            _btnCopy.CustomBackColor = AppColors.Success;
            timer.Stop();
            timer.Dispose();
        };
        timer.Start();
    }
}
