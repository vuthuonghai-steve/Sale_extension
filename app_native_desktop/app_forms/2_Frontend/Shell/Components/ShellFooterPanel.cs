using System.Drawing;
using AppForms.Frontend.Shared.Theme;
using AppForms.Shared.Constants;

namespace AppForms.Frontend.Shell.Components;

/// <summary>
/// Sub-Component hiển thị thanh trạng thái Footer của Shell Container
/// </summary>
public class ShellFooterPanel : Panel
{
    private readonly Label _lblFooterStatus;

    public ShellFooterPanel()
    {
        Dock = DockStyle.Bottom;
        Height = 26;
        BackColor = AppColors.SurfaceInput;
        Padding = new Padding(10, 4, 10, 4);

        _lblFooterStatus = new Label
        {
            Text = $"Sẵn sàng | Sidepanel Assistant | v{AppConstants.AppVersion}",
            Font = AppFonts.Badge,
            ForeColor = AppColors.TextMuted,
            Dock = DockStyle.Fill,
            TextAlign = ContentAlignment.MiddleLeft
        };

        Controls.Add(_lblFooterStatus);
    }

    public void SetStatusText(string statusText)
    {
        _lblFooterStatus.Text = statusText;
    }
}
