using System.Drawing;

namespace AppForms.Frontend.Shared.Theme;

public static class AppColors
{
    // Backgrounds
    public static readonly Color BackgroundDark = Color.FromArgb(18, 18, 24);
    public static readonly Color SurfaceDark = Color.FromArgb(28, 28, 38);
    public static readonly Color SurfaceHighlight = Color.FromArgb(38, 38, 52);
    public static readonly Color SurfaceInput = Color.FromArgb(22, 22, 30);

    // Accents
    public static readonly Color Primary = Color.FromArgb(99, 102, 241);       // Indigo 500
    public static readonly Color PrimaryHover = Color.FromArgb(129, 140, 248);  // Indigo 400
    public static readonly Color PrimaryActive = Color.FromArgb(79, 70, 229);   // Indigo 600

    public static readonly Color Success = Color.FromArgb(34, 197, 94);        // Emerald 500
    public static readonly Color Warning = Color.FromArgb(245, 158, 11);       // Amber 500
    public static readonly Color Danger = Color.FromArgb(239, 68, 68);         // Rose 500
    public static readonly Color Info = Color.FromArgb(59, 130, 246);          // Blue 500

    // Text & Foreground
    public static readonly Color TextPrimary = Color.FromArgb(248, 250, 252);
    public static readonly Color TextSecondary = Color.FromArgb(148, 163, 184);
    public static readonly Color TextMuted = Color.FromArgb(100, 116, 139);

    // Borders & Separators
    public static readonly Color BorderSubtle = Color.FromArgb(45, 45, 60);
    public static readonly Color BorderHighlight = Color.FromArgb(70, 70, 95);
}
