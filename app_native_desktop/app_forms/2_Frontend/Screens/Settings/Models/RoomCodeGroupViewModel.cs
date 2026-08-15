namespace AppForms.Frontend.Screens.Settings.Models;

/// <summary>
/// ViewModel hiển thị danh mục mã phòng của một sàn đích trên UI
/// </summary>
public class RoomCodeGroupViewModel
{
    public string SchemaId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Icon { get; set; } = "🏢";
    public List<string> Codes { get; set; } = new();
    public int TotalCount => Codes.Count;

    public override string ToString() => $"{Icon} {DisplayName} ({TotalCount} mã)";
}
