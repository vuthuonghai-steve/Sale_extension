using System.Text.Json.Serialization;

namespace AppForms.Shared.Models.SpecialMapping;

/// <summary>
/// Entity đại diện cho toàn bộ file lưu trữ danh mục mã đặc biệt (special_room_mappings.json)
/// </summary>
public class SpecialRoomMappingRegistryEntity
{
    [JsonPropertyName("version")]
    public int Version { get; set; } = 1;

    [JsonPropertyName("lastUpdated")]
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("description")]
    public string Description { get; set; } = "Kho lưu trữ mã phòng đặc biệt và bảng đối chiếu chéo đa sàn";

    [JsonPropertyName("items")]
    public List<SpecialRoomMappingEntity> Items { get; set; } = new();
}
