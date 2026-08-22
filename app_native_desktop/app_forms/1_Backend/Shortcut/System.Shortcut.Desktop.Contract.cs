namespace AppForms.Backend.Shortcut;

public interface IDesktopShortcutService
{
    /// <summary>
    /// Tự động kiểm tra và đảm bảo Shortcut trên Desktop luôn trỏ đúng bản app hiện tại (Self-Healing).
    /// </summary>
    ShortcutResult EnsureShortcutSelfHeal();

    /// <summary>
    /// Tạo hoặc làm mới Shortcut trên Desktop & Start Menu.
    /// </summary>
    ShortcutResult CreateOrUpdateShortcut(bool desktop = true, bool startMenu = true);

    /// <summary>
    /// Gỡ bỏ Shortcut khỏi Desktop & Start Menu.
    /// </summary>
    ShortcutResult RemoveShortcut(bool desktop = true, bool startMenu = true);

    /// <summary>
    /// Kiểm tra xem Shortcut ngoài Desktop có đang tồn tại không.
    /// </summary>
    bool IsDesktopShortcutExists();
}
