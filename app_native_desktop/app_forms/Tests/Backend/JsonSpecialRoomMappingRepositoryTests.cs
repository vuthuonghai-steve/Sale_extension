using AppForms.Backend.Adapters.Persistence;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace AppForms.Tests.Backend;

public class JsonSpecialRoomMappingRepositoryTests : IDisposable
{
    private readonly string _testTempDir;
    private readonly JsonSpecialRoomMappingRepository _repository;

    public JsonSpecialRoomMappingRepositoryTests()
    {
        _testTempDir = Path.Combine(Path.GetTempPath(), "AppForms_SpecialTests_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_testTempDir);

        _repository = new JsonSpecialRoomMappingRepository(
            NullLogger<JsonSpecialRoomMappingRepository>.Instance,
            Path.Combine(_testTempDir, "special_room_mappings.json"));
    }

    public void Dispose()
    {
        try
        {
            if (Directory.Exists(_testTempDir))
            {
                Directory.Delete(_testTempDir, true);
            }
        }
        catch
        {
            // Ignore cleanup errors
        }
    }

    [Fact]
    public void SeedData_LoadsSuccessfully_Contains34Items()
    {
        var all = _repository.GetAll();
        Assert.NotEmpty(all);
        Assert.True(all.Count >= 34, $"Expected at least 34 items from seed data, got {all.Count}");
    }

    [Theory]
    [InlineData("AHS284", "Phan Anh")]
    [InlineData("ST460", "Phan Anh")]
    [InlineData("MN - 220", "Phan Anh")]
    [InlineData("MN-220", "Phan Anh")]
    [InlineData("MN220", "Phan Anh")]
    [InlineData("DN01", "Phan Anh")]
    [InlineData("A520", "Thu Hằng")]
    [InlineData("DN12", "Thu Hằng")]
    [InlineData("A1197", "Thành Luân")]
    [InlineData("DN28", "Thành Luân")]
    [InlineData("454", "Pham Hien")]
    [InlineData("C454", "Pham Hien")]
    [InlineData("c454", "Pham Hien")]
    [InlineData("C-454", "Pham Hien")]
    [InlineData("c-454", "Pham Hien")]
    [InlineData("C 454", "Pham Hien")]
    [InlineData("C973", "Princess")]
    [InlineData("c085", "Hải Good Land")]
    [InlineData("A751", "Pham Hien")]
    [InlineData("NT020", "Pham Hien")]
    [InlineData("DN14", "Pham Hien")]
    [InlineData("SW207", "Duy Tuyên")]
    [InlineData("DN20", "Duy Tuyên")]
    [InlineData("489", "Ánh Tuyết B Đ S")]
    [InlineData("DN29", "Ánh Tuyết B Đ S")]
    [InlineData("063", "Nhật Anh Mp")]
    [InlineData("DN30", "Nhật Anh Mp")]
    [InlineData("A206", "Lusaco")]
    [InlineData("59", "Lusaco")]
    public void FindMappingByCode_KnownSpecialCodes_ReturnsCorrectManager(string roomCode, string expectedManager)
    {
        var mapping = _repository.FindMappingByCode(roomCode);
        Assert.NotNull(mapping);
        Assert.Equal(expectedManager, mapping!.ManagerName);
    }

    [Theory]
    [InlineData("0977274446", "Phan Anh")]
    [InlineData("0868168821", "Thu Hằng")]
    [InlineData("0976828397", "Thành Luân")]
    [InlineData("0971053222", "Duy Tuyên")]
    [InlineData("0879240000", "Princess")]
    [InlineData("0879.24.0000", "Princess")]
    [InlineData("0975293143", "Ánh Tuyết B Đ S")]
    [InlineData("0975.29.31.43", "Ánh Tuyết B Đ S")]
    [InlineData("0961951102", "Nhật Anh Mp")]
    public void FindMappingByPhone_KnownPhones_ReturnsCorrectManager(string phone, string expectedManager)
    {
        var mapping = _repository.FindMappingByPhone(phone);
        Assert.NotNull(mapping);
        Assert.Equal(expectedManager, mapping!.ManagerName);
    }

    [Fact]
    public void FindMappingByText_TextContainingSpecialRoomCode_ReturnsMapping()
    {
        var rawText = "Khách hỏi phòng mã AHS284 đường Cầu Giấy giá 4tr5";
        var mapping = _repository.FindMappingByText(rawText);

        Assert.NotNull(mapping);
        Assert.Equal("Phan Anh", mapping!.ManagerName);
        Assert.Equal("0977274446", mapping.Phone);
    }

    [Fact]
    public void FindMappingByCode_UnknownCode_ReturnsNull()
    {
        var mapping = _repository.FindMappingByCode("UNKNOWN_CODE_99999");
        Assert.Null(mapping);
    }
}
