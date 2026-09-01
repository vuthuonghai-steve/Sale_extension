namespace AppForms.Shared.Constants;

public static class AppConstants
{
    public const string AppName = "Sale Lead Form Converter";
    public const string AppVersion = "1.2.0";
    public const string DefaultCtvName = "Thiên Ngọc";
    public const string SettingsFileName = "form_settings.json";

    public static class UI
    {
        public const int DefaultWindowWidth = 1080;
        public const int DefaultWindowHeight = 720;
        public const int MinWindowWidth = 900;
        public const int MinWindowHeight = 600;
    }

    public static class Win32Messages
    {
        public const int WM_CLIPBOARDUPDATE = 0x031D;
        public const int WM_HOTKEY = 0x0312;
    }

    public static class HotkeySnippets
    {
        public const string DefaultDividerLine = "================================================";
        public const string DefaultDividerHotkeyId = "snippet_divider_line";
    }
}

