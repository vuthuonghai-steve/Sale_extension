using System.Text.Json.Serialization;

namespace AppForms.Shared.Models.SpecialMapping;

/// <summary>
/// Entity thông tin một bản ghi đối chiếu mã phòng đặc biệt giữa các sàn
/// </summary>
public class SpecialRoomMappingEntity
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("stt")]
    public int Stt { get; set; }

    [JsonPropertyName("buildingNo")]
    public string? BuildingNo { get; set; }

    [JsonPropertyName("managerName")]
    public string? ManagerName { get; set; }

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("commission")]
    public string? Commission { get; set; }

    [JsonPropertyName("sheetLink")]
    public string? SheetLink { get; set; }

    [JsonPropertyName("platformCodes")]
    public Dictionary<string, string> PlatformCodes { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    [JsonPropertyName("matchedCodes")]
    public List<string> MatchedCodes { get; set; } = new();
}
