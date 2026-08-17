using AppForms.Shared.Enums;

namespace AppForms.Backend.Contracts.Entities;

/// <summary>
/// Kết quả chi tiết sau khi nhận diện định dạng sàn (Output Schema)
/// </summary>
public class SchemaDetectionResult
{
    public SchemaDetectionStatus Status { get; set; } = SchemaDetectionStatus.NotFound;
    public string? MatchedSchemaId { get; set; }
    public IReadOnlyList<string> CandidateSchemaIds { get; set; } = Array.Empty<string>();
    public string? ConflictMessage { get; set; }

    public static SchemaDetectionResult Exact(string schemaId) => new()
    {
        Status = SchemaDetectionStatus.ExactMatch,
        MatchedSchemaId = schemaId,
        CandidateSchemaIds = new[] { schemaId }
    };

    public static SchemaDetectionResult Conflict(IEnumerable<string> candidateSchemaIds, string message) => new()
    {
        Status = SchemaDetectionStatus.AmbiguousConflict,
        CandidateSchemaIds = candidateSchemaIds.ToList(),
        ConflictMessage = message
    };

    public static SchemaDetectionResult NotFoundResult(string? message = null) => new()
    {
        Status = SchemaDetectionStatus.NotFound,
        ConflictMessage = message
    };
}
