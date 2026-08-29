using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Services;
using AppForms.Shared.Models.SpecialMapping;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace AppForms.Tests.Backend;

public class SpecialRoomMappingDetectorTests
{
    private readonly Mock<ISpecialRoomMappingRepository> _mockRepo;
    private readonly Mock<ISpecialMappingTextParser> _mockParser;
    private readonly SpecialRoomMappingDetector _detector;

    public SpecialRoomMappingDetectorTests()
    {
        _mockRepo = new Mock<ISpecialRoomMappingRepository>();
        _mockParser = new Mock<ISpecialMappingTextParser>();

        _detector = new SpecialRoomMappingDetector(
            _mockRepo.Object,
            _mockParser.Object,
            NullLogger<SpecialRoomMappingDetector>.Instance);
    }

    [Fact]
    public void Detect_Priority1_MatchesByLeadRoomCodeFirst()
    {
        // Arrange
        var lead = new LeadEntity { RoomCode = "AHS284", CustomerPhone = "0977274446" };
        var codeMatch = new SpecialRoomMappingEntity { Stt = 1, ManagerName = "Phan Anh (Code)" };
        _mockRepo.Setup(r => r.FindMappingByCode("AHS284")).Returns(codeMatch);

        // Act
        var result = _detector.Detect(lead, "raw text contains other things");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Phan Anh (Code)", result!.ManagerName);
        _mockRepo.Verify(r => r.FindMappingByCode("AHS284"), Times.Once);
        _mockParser.Verify(p => p.FindMappingInText(It.IsAny<string>(), It.IsAny<ISpecialRoomMappingRepository>()), Times.Never);
    }

    [Fact]
    public void Detect_WhenRoomCodeExistsButNotSpecial_ReturnsNull_DoesNotFallbackToRawText()
    {
        // Arrange: Form có trường RoomCode rõ ràng là D170 (không phải mã đặc biệt)
        var lead = new LeadEntity { RoomCode = "D170", CustomerPhone = "0982221407" };
        _mockRepo.Setup(r => r.FindMappingByCode("D170")).Returns((SpecialRoomMappingEntity?)null);

        // Act
        var result = _detector.Detect(lead, "ngách 40 ngõ 61 bằng liệt");

        // Assert: Trả về null ngay, KHÔNG fallback cào bới raw text
        Assert.Null(result);
        _mockRepo.Verify(r => r.FindMappingByCode("D170"), Times.Once);
        _mockParser.Verify(p => p.FindMappingInText(It.IsAny<string>(), It.IsAny<ISpecialRoomMappingRepository>()), Times.Never);
    }

    [Fact]
    public void Detect_WhenNoRoomCode_FallsBackToRawText()
    {
        // Arrange: Lead không có RoomCode (tin nhắn dạng tự do)
        var lead = new LeadEntity { RoomCode = "", CustomerPhone = "0977274446" };
        var textMatch = new SpecialRoomMappingEntity { Stt = 2, ManagerName = "Thu Hằng (Text)" };
        _mockParser.Setup(p => p.FindMappingInText("tin nhắn tự do chứa mã A520", _mockRepo.Object)).Returns(textMatch);

        // Act
        var result = _detector.Detect(lead, "tin nhắn tự do chứa mã A520");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Thu Hằng (Text)", result!.ManagerName);
        _mockParser.Verify(p => p.FindMappingInText("tin nhắn tự do chứa mã A520", _mockRepo.Object), Times.Once);
    }

    [Fact]
    public void Detect_WhenNothingMatches_ReturnsNull()
    {
        var lead = new LeadEntity { RoomCode = "", CustomerPhone = "0900000000" };
        _mockParser.Setup(p => p.FindMappingInText("normal text", _mockRepo.Object)).Returns((SpecialRoomMappingEntity?)null);

        var result = _detector.Detect(lead, "normal text");

        Assert.Null(result);
    }
}
