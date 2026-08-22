namespace AppForms.Backend.Shortcut;

public record ShortcutResult(
    bool IsSuccess,
    string Message,
    string? DesktopPath = null,
    string? StartMenuPath = null,
    bool IsCreatedOrUpdated = false)
{
    public static ShortcutResult Success(string message, string? desktop = null, string? startMenu = null, bool isCreatedOrUpdated = false)
        => new(true, message, desktop, startMenu, isCreatedOrUpdated);

    public static ShortcutResult Failed(string error)
        => new(false, error, IsCreatedOrUpdated: false);
}
