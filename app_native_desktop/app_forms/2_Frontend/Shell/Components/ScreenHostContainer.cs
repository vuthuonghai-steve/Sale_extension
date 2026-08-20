using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Shell.Components;

/// <summary>
/// Sub-Component chịu trách nhiệm quản lý Viewport và nạp/hoán đổi Screen Control an toàn
/// </summary>
public class ScreenHostContainer : Panel
{
    public ScreenHostContainer()
    {
        Dock = DockStyle.Fill;
        BackColor = AppColors.BackgroundDark;
    }

    public void MountScreen(Control? screenControl)
    {
        if (screenControl == null)
        {
            Controls.Clear();
            return;
        }

        Controls.Clear();
        screenControl.Dock = DockStyle.Fill;
        Controls.Add(screenControl);
        screenControl.BringToFront();
    }
}
