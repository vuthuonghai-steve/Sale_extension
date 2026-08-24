using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Services;
using AppForms.Shared.Models.SpecialMapping;
using Moq;
using Xunit;

namespace AppForms.Tests.Backend;

public class SpecialMappingTextParserTests
{
    private readonly SpecialMappingTextParser _parser;

    public SpecialMappingTextParserTests()
    {
        _parser = new SpecialMappingTextParser();
    }

    [Theory]
    [InlineData(" AHS 284 ", "AHS284")]
    [InlineData("MN - 220", "MN-220")]
    [InlineData("ST 460", "ST460")]
    [InlineData("  DN 01\t", "DN01")]
    [InlineData("", "")]
    [InlineData("   ", "")]
    public void CleanCode_RemovesWhitespaceCorrectly(string input, string expected)
    {
        var result = _parser.CleanCode(input);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("0977274446", "0977274446")]
    [InlineData("+84977274446", "0977274446")]
    [InlineData("84977274446", "0977274446")]
    [InlineData("0879.24.0000", "0879240000")]
    [InlineData("097-682-8397", "0976828397")]
    [InlineData("(0971) 053 222", "0971053222")]
    [InlineData("", "")]
    public void CleanPhone_StandardizesPhoneNumber(string input, string expected)
    {
        var result = _parser.CleanPhone(input);
        Assert.Equal(expected, result);
    }

    [Fact]
    public void FindMappingInText_WhenPhoneFoundInText_ReturnsMappingFromRepository()
    {
        // Arrange
        var mockRepo = new Mock<ISpecialRoomMappingRepository>();
        var expectedMapping = new SpecialRoomMappingEntity { Stt = 1, ManagerName = "Phan Anh", Phone = "0977274446" };
        mockRepo.Setup(r => r.FindMappingByPhone("0977274446")).Returns(expectedMapping);

        var text = "Khách liên hệ số 0977274446 để hẹn xem phòng";

        // Act
        var result = _parser.FindMappingInText(text, mockRepo.Object);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Phan Anh", result!.ManagerName);
        mockRepo.Verify(r => r.FindMappingByPhone("0977274446"), Times.Once);
    }

    [Fact]
    public void FindMappingInText_WhenCodeFoundInText_ReturnsMappingFromRepository()
    {
        // Arrange
        var mockRepo = new Mock<ISpecialRoomMappingRepository>();
        var expectedMapping = new SpecialRoomMappingEntity { Stt = 1, ManagerName = "Phan Anh" };
        mockRepo.Setup(r => r.FindMappingByCode("AHS284")).Returns(expectedMapping);

        var text = "Cần check trống phòng AHS284 Cầu Giấy";

        // Act
        var result = _parser.FindMappingInText(text, mockRepo.Object);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Phan Anh", result!.ManagerName);
        mockRepo.Verify(r => r.FindMappingByCode("AHS284"), Times.Once);
    }

    [Fact]
    public void FindMappingInText_WhenEmptyOrNoMatch_ReturnsNull()
    {
        var mockRepo = new Mock<ISpecialRoomMappingRepository>();
        var result = _parser.FindMappingInText(string.Empty, mockRepo.Object);
        Assert.Null(result);

        var resultNoMatch = _parser.FindMappingInText("Xin chào bạn", mockRepo.Object);
        Assert.Null(resultNoMatch);
    }
}
