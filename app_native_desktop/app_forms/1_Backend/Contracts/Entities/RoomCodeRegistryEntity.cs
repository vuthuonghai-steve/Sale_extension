using System.Text.Json.Serialization;

namespace AppForms.Backend.Contracts.Entities;

/// <summary>
/// Entity đại diện cho toàn bộ file lưu trữ kho mã phòng (room_codes.json)
/// </summary>
public class RoomCodeRegistryEntity
{
    [JsonPropertyName("version")]
    public int Version { get; set; } = 1;

    [JsonPropertyName("lastUpdated")]
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("groups")]
    public Dictionary<string, RoomGroupEntity> Groups { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}

/// <summary>
/// Entity thông tin danh mục mã của một Group / Sàn đích
/// </summary>
public class RoomGroupEntity
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("codes")]
    public List<string> Codes { get; set; } = new();
}
