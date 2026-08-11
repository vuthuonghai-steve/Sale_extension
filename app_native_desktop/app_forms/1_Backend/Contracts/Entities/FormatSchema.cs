namespace AppForms.Backend.Contracts.Entities;

public record FormatField
{
    public string Key { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public string Prefix { get; init; } = string.Empty;
    public string Suffix { get; init; } = string.Empty;
    public string? FallbackTo { get; init; }
    public bool Required { get; init; } = false;
}

public record FormatSchema
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Icon { get; init; } = "📋";
    public string Description { get; init; } = string.Empty;
    public string HeaderTemplate { get; init; } = string.Empty;
    public string FooterTemplate { get; init; } = string.Empty;
    public Dictionary<string, string> DefaultValues { get; init; } = new(StringComparer.OrdinalIgnoreCase);
    public List<FormatField> Fields { get; init; } = new();
}

public record ConversionItem
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string RawInput { get; init; } = string.Empty;
    public LeadEntity Lead { get; init; } = new();
    public Dictionary<string, string> FormattedOutputs { get; init; } = new();
    public string SelectedSchemaId { get; init; } = string.Empty;
    public DateTime ConvertedAt { get; init; } = DateTime.Now;
}
