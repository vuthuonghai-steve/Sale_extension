namespace AppForms.Backend.Contracts.Entities;

public record LeadEntity
{
    public string? TeamName { get; init; }
    public string? CustomerName { get; init; }
    public string? CustomerPhone { get; init; }
    public string? Address { get; init; }
    public string? ViewTime { get; init; }
    public string? Price { get; init; }
    public string? RoomCode { get; init; }
    public string? SalesName { get; init; }
    public string? RawNotes { get; init; }

    public string? GetValueByKey(string key)
    {
        return key.ToLowerInvariant() switch
        {
            "teamname" => TeamName,
            "customername" => CustomerName,
            "customerphone" => CustomerPhone,
            "address" => Address,
            "viewtime" => ViewTime,
            "price" => Price,
            "roomcode" => RoomCode,
            "salesname" => SalesName,
            "rawnotes" => RawNotes,
            _ => null
        };
    }
}
