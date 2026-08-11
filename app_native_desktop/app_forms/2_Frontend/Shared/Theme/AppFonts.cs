using System.Drawing;

namespace AppForms.Frontend.Shared.Theme;

public static class AppFonts
{
    private const string FontFamilyDefault = "Segoe UI";
    private const string FontFamilyMono = "Consolas";

    public static readonly Font Header = new(FontFamilyDefault, 13f, FontStyle.Bold);
    public static readonly Font SubHeader = new(FontFamilyDefault, 10.5f, FontStyle.Bold);
    public static readonly Font Body = new(FontFamilyDefault, 9f, FontStyle.Regular);
    public static readonly Font BodyBold = new(FontFamilyDefault, 9f, FontStyle.Bold);
    public static readonly Font Caption = new(FontFamilyDefault, 8.5f, FontStyle.Regular);
    public static readonly Font CaptionBold = new(FontFamilyDefault, 8.5f, FontStyle.Bold);
    public static readonly Font Monospace = new(FontFamilyMono, 9f, FontStyle.Regular);
    public static readonly Font Badge = new(FontFamilyDefault, 7.5f, FontStyle.Bold);
}
