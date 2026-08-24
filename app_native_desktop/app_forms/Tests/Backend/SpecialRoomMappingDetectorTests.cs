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
        _mockRepo.Verify(r => r.FindMappingByPhone(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public void Detect_Priority2_WhenRoomCodeFails_MatchesByRawText()
    {
        // Arrange
        var lead = new LeadEntity { RoomCode = "UNKNOWN_CODE", CustomerPhone = "0977274446" };
        _mockRepo.Setup(r => r.FindMappingByCode("UNKNOWN_CODE")).Returns((SpecialRoomMappingEntity?)null);

        var textMatch = new SpecialRoomMappingEntity { Stt = 2, ManagerName = "Thu Hằng (Text)" };
        _mockParser.Setup(p => p.FindMappingInText("raw text with 0868168821", _mockRepo.Object)).Returns(textMatch);

        // Act
        var result = _detector.Detect(lead, "raw text with 0868168821");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Thu Hằng (Text)", result!.ManagerName);
        _mockRepo.Verify(r => r.FindMappingByCode("UNKNOWN_CODE"), Times.Once);
        _mockParser.Verify(p => p.FindMappingInText("raw text with 0868168821", _mockRepo.Object), Times.Once);
        _mockRepo.Verify(r => r.FindMappingByPhone(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public void Detect_Priority3_WhenCodeAndTextFail_MatchesByCustomerPhone()
    {
        // Arrange
        var lead = new LeadEntity { RoomCode = "UNKNOWN_CODE", CustomerPhone = "0971053222" };
        _mockRepo.Setup(r => r.FindMappingByCode("UNKNOWN_CODE")).Returns((SpecialRoomMappingEntity?)null);
        _mockParser.Setup(p => p.FindMappingInText("raw text", _mockRepo.Object)).Returns((SpecialRoomMappingEntity?)null);

        var phoneMatch = new SpecialRoomMappingEntity { Stt = 3, ManagerName = "Duy Tuyên (Phone)" };
        _mockRepo.Setup(r => r.FindMappingByPhone("0971053222")).Returns(phoneMatch);

        // Act
        var result = _detector.Detect(lead, "raw text");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Duy Tuyên (Phone)", result!.ManagerName);
        _mockRepo.Verify(r => r.FindMappingByCode("UNKNOWN_CODE"), Times.Once);
        _mockParser.Verify(p => p.FindMappingInText("raw text", _mockRepo.Object), Times.Once);
        _mockRepo.Verify(r => r.FindMappingByPhone("0971053222"), Times.Once);
    }

    [Fact]
    public void Detect_WhenNothingMatches_ReturnsNull()
    {
        var lead = new LeadEntity { RoomCode = "NORMAL_ROOM", CustomerPhone = "0900000000" };
        _mockRepo.Setup(r => r.FindMappingByCode("NORMAL_ROOM")).Returns((SpecialRoomMappingEntity?)null);
        _mockParser.Setup(p => p.FindMappingInText("normal text", _mockRepo.Object)).Returns((SpecialRoomMappingEntity?)null);
        _mockRepo.Setup(r => r.FindMappingByPhone("0900000000")).Returns((SpecialRoomMappingEntity?)null);

        var result = _detector.Detect(lead, "normal text");

        Assert.Null(result);
    }
}
