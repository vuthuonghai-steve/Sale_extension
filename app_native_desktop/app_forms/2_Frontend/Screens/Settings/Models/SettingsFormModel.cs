namespace AppForms.Frontend.Screens.Settings.Models;

/// <summary>
/// DTO chứa dữ liệu Form cài đặt chung
/// </summary>
public class SettingsFormModel
{
    public string FixedCtvName { get; set; } = string.Empty;
    public bool AutoStartClipboardListening { get; set; }
    public bool MinimizeToTrayOnClose { get; set; }
}
