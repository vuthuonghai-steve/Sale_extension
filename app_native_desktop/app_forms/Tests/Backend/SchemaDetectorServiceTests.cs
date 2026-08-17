using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Services;
using AppForms.Shared.Enums;
using Moq;
using Xunit;

namespace AppForms.Tests.Backend;

public class SchemaDetectorServiceTests
{
    private readonly Mock<IRoomCodeReadOnlyRepository> _mockRepo;
    private readonly SchemaDetectorService _detector;

    public SchemaDetectorServiceTests()
    {
        _mockRepo = new Mock<IRoomCodeReadOnlyRepository>();
        _detector = new SchemaDetectorService(_mockRepo.Object);
    }

    /// <summary>
    /// TC-02: SchemaDetectorService Exact Match
    /// Kiểm tra nhận diện chính xác 1 sàn duy nhất qua prefix hoặc qua RoomCodeRepository match duy nhất 1 schema.
    /// </summary>
    [Fact]
    public void TC02_ExactMatch_SingleCandidateInRepo_ReturnsExactMatchStatusAndSchemaId()
    {
        // Arrange
        var lead = new LeadEntity { RoomCode = "ROOM_LUSACO_99" };
        _mockRepo.Setup(r => r.GetSchemaIdsByCode("ROOM_LUSACO_99")).Returns(new List<string> { "lusaco" });

        // Act
        var result = _detector.DetectSchemaWithDetails(lead);
        var schemaId = _detector.DetectSchemaId(lead);

        // Assert
        Assert.Equal(SchemaDetectionStatus.ExactMatch, result.Status);
        Assert.Equal("lusaco", result.MatchedSchemaId);
        Assert.Single(result.CandidateSchemaIds);
        Assert.Equal("lusaco", result.CandidateSchemaIds[0]);
        Assert.Equal("lusaco", schemaId);
    }

    /// <summary>
    /// TC-02: SchemaDetectorService Exact Match via Prefix Signature
    /// Prefix 'Mn', 'Ts', 'NT', '95', 'TL' tự động nhận diện sàn tương ứng.
    /// </summary>
    [Theory]
    [InlineData("Mn 35", "lusaco")]
    [InlineData("Ts007", "hd_homes")]
    [InlineData("NT023", "nt_home")]
    [InlineData("95-01", "95_home")]
    [InlineData("TL-99", "tl21_house")]
    public void TC02_ExactMatch_PrefixSignature_DetectsCorrectSchema(string roomCode, string expectedSchema)
    {
        // Arrange
        var lead = new LeadEntity { RoomCode = roomCode };

        // Act
        var result = _detector.DetectSchemaWithDetails(lead);
        var schemaId = _detector.DetectSchemaId(lead);

        // Assert
        Assert.Equal(SchemaDetectionStatus.ExactMatch, result.Status);
        Assert.Equal(expectedSchema, result.MatchedSchemaId);
        Assert.Equal(expectedSchema, schemaId);
    }

    /// <summary>
    /// TC-03: Ambiguous Conflict Detection (Trùng mã giữa nhiều sàn)
    /// Khi mã phòng thuộc >= 2 sàn, trả về AmbiguousConflict, MatchedSchemaId == null, và có ConflictMessage chi tiết.
    /// </summary>
    [Fact]
    public void TC03_AmbiguousConflictDetection_MultipleSchemasFound_ReturnsConflictStatusAndNullSchemaId()
    {
        // Arrange
        var lead = new LeadEntity { RoomCode = "302" };
        var conflictingSchemas = new List<string> { "lusaco", "hd_homes" };
        _mockRepo.Setup(r => r.GetSchemaIdsByCode("302")).Returns(conflictingSchemas);
        _mockRepo.Setup(r => r.GetGroupName("lusaco")).Returns("Sàn Lusaco");
        _mockRepo.Setup(r => r.GetGroupName("hd_homes")).Returns("HD Homes");

        // Act
        var result = _detector.DetectSchemaWithDetails(lead);
        var schemaId = _detector.DetectSchemaId(lead);

        // Assert
        Assert.Equal(SchemaDetectionStatus.AmbiguousConflict, result.Status);
        Assert.Null(result.MatchedSchemaId);
        Assert.Equal(2, result.CandidateSchemaIds.Count);
        Assert.Contains("lusaco", result.CandidateSchemaIds);
        Assert.Contains("hd_homes", result.CandidateSchemaIds);
        Assert.NotNull(result.ConflictMessage);
        Assert.Contains("302", result.ConflictMessage);
        Assert.Contains("Sàn Lusaco", result.ConflictMessage);
        Assert.Contains("HD Homes", result.ConflictMessage);

        // DetectSchemaId helper must return null on conflict (no silent guessing)
        Assert.Null(schemaId);
    }

    /// <summary>
    /// TC-04: Not Found Null State
    /// Khi mã phòng không khớp sàn nào, trả về NotFound và MatchedSchemaId == null.
    /// </summary>
    [Fact]
    public void TC04_NotFound_UnknownRoomCodeAndNoKeywords_ReturnsNotFoundStatusAndNullSchemaId()
    {
        // Arrange
        var lead = new LeadEntity { RoomCode = "UNKNOWN_CODE_9999" };
        _mockRepo.Setup(r => r.GetSchemaIdsByCode(It.IsAny<string>())).Returns(new List<string>());

        // Act
        var result = _detector.DetectSchemaWithDetails(lead);
        var schemaId = _detector.DetectSchemaId(lead);

        // Assert
        Assert.Equal(SchemaDetectionStatus.NotFound, result.Status);
        Assert.Null(result.MatchedSchemaId);
        Assert.Empty(result.CandidateSchemaIds);
        Assert.Null(schemaId);
    }

    /// <summary>
    /// Kiểm tra nhận diện qua TeamName hoặc từ khóa trong rawText.
    /// </summary>
    [Theory]
    [InlineData("Team Lusaco", "lusaco")]
    [InlineData("HD HOMES GROUP", "hd_homes")]
    [InlineData("NT Home Real", "nt_home")]
    public void DetectSchema_FromTeamNameKeyword_ReturnsExactMatch(string teamName, string expectedSchema)
    {
        // Arrange
        var lead = new LeadEntity { TeamName = teamName };
        _mockRepo.Setup(r => r.GetSchemaIdsByCode(It.IsAny<string>())).Returns(new List<string>());

        // Act
        var result = _detector.DetectSchemaWithDetails(lead);

        // Assert
        Assert.Equal(SchemaDetectionStatus.ExactMatch, result.Status);
        Assert.Equal(expectedSchema, result.MatchedSchemaId);
    }
}
