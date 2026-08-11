using AppForms.Shared.Constants;

namespace AppForms.Backend.Contracts.Entities;

public class AppSettings
{
    public string FixedCtvName { get; set; } = AppConstants.DefaultCtvName;
    public bool AutoStartClipboardListening { get; set; } = true;
    public bool MinimizeToTrayOnClose { get; set; } = true;
    public string DefaultSelectedSchemaId { get; set; } = "a_sky_group";
    public bool AutoCopyFormattedOutput { get; set; } = false;
    public int MaxHistoryCount { get; set; } = 100;
}
