using System.Collections.Concurrent;
using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace AppForms.Tests.Backend;

public class JsonRoomCodeRepositoryTests : IDisposable
{
    private readonly string _testTempDir;
    private readonly JsonRoomCodeRepository _repository;

    public JsonRoomCodeRepositoryTests()
    {
        _testTempDir = Path.Combine(Path.GetTempPath(), "AppForms_Tests_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_testTempDir);

        _repository = new JsonRoomCodeRepository(NullLogger<JsonRoomCodeRepository>.Instance, Path.Combine(_testTempDir, "room_codes.json"));
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

    /// <summary>
    /// TC-01: Multi-Schema Mapping Cache 1-N (JsonRoomCodeRepository)
    /// Kiểm tra mã phòng được ánh xạ tới nhiều SchemaId cùng lúc mà không bị ghi đè.
    /// </summary>
    [Fact]
    public void TC01_MultiSchemaMapping_SameCodeInMultipleSchemas_ReturnsAllSchemas()
    {
        // Arrange
        var code = "TEST_ROOM_101";
        var schema1 = "lusaco";
        var schema2 = "hd_homes";

        // Act
        var reg1 = _repository.RegisterCodes(schema1, new[] { code });
        var reg2 = _repository.RegisterCodes(schema2, new[] { code });

        var schemaIds = _repository.GetSchemaIdsByCode(code);
        var hasDuplicate = _repository.HasDuplicateCode(code);

        // Assert
        Assert.True(reg1.IsSuccess);
        Assert.True(reg2.IsSuccess);
        Assert.Equal(2, schemaIds.Count);
        Assert.Contains(schema1, schemaIds);
        Assert.Contains(schema2, schemaIds);
        Assert.True(hasDuplicate);

        // Single schema lookup should return null because of ambiguity
        Assert.Null(_repository.GetSchemaIdByCode(code));
    }

    /// <summary>
    /// TC-09 (Failure Mode 1): Extreme Code Overlap (Trùng mã trên 3-4 sàn khác nhau)
    /// Đảm bảo không bị mất dữ liệu khi 4 sàn cùng có mã "101".
    /// </summary>
    [Fact]
    public void TC09_FailureMode1_ExtremeCodeOverlap_Across4Schemas_PreservesAllMappings()
    {
        // Arrange
        var overlapCode = "101";
        var schemas = new[] { "lusaco", "hd_homes", "95_home", "tl21_house" };

        // Act
        foreach (var s in schemas)
        {
            var res = _repository.RegisterCodes(s, new[] { overlapCode });
            Assert.True(res.IsSuccess);
        }

        var matchedSchemas = _repository.GetSchemaIdsByCode(overlapCode);
        var isDuplicate = _repository.HasDuplicateCode(overlapCode);

        // Assert
        Assert.Equal(4, matchedSchemas.Count);
        foreach (var s in schemas)
        {
            Assert.Contains(s, matchedSchemas);
        }
        Assert.True(isDuplicate);
        Assert.Null(_repository.GetSchemaIdByCode(overlapCode));
    }

    /// <summary>
    /// TC-10 (Failure Mode 2): CleanCode Normalization
    /// Kiểm tra chuẩn hóa mã phòng có khoảng trắng, ký tự đặc biệt, dấu gạch ngang và case-insensitive.
    /// </summary>
    [Theory]
    [InlineData("   512 / P.3   ", "512/P.3")]
    [InlineData("  MN - 324  ", "MN-324")]
    [InlineData("  mn-324  ", "MN-324")]
    [InlineData("MN324", "MN-324")]
    public void TC10_FailureMode2_CleanCodeNormalization_HandlesWhitespaceAndHyphens(string inputQuery, string registeredCode)
    {
        // Arrange
        var schemaId = "lusaco";
        _repository.RegisterCodes(schemaId, new[] { registeredCode });

        // Act
        var matched = _repository.GetSchemaIdsByCode(inputQuery);

        // Assert
        Assert.NotEmpty(matched);
        Assert.Contains(schemaId, matched);
    }

    /// <summary>
    /// TC-11 (Failure Mode 3): Concurrency Thread-Safety
    /// Đồng thời đọc, tra cứu, đăng ký mã và lưu file từ nhiều luồng nền tảng.
    /// </summary>
    [Fact]
    public async Task TC11_FailureMode3_ConcurrencyThreadSafety_ParallelReadWrites_NoExceptionsOrDataCorruption()
    {
        // Arrange
        const int taskCount = 30;
        var exceptions = new ConcurrentBag<Exception>();

        // Act
        var tasks = Enumerable.Range(0, taskCount).Select(i => Task.Run(() =>
        {
            try
            {
                var schemaId = (i % 2 == 0) ? "lusaco" : "hd_homes";
                var code = $"CONCURRENT_ROOM_{i % 5}";

                _repository.RegisterCodes(schemaId, new[] { code, $"UNIQUE_CODE_{i}" });
                var results = _repository.GetSchemaIdsByCode(code);
                var isDup = _repository.HasDuplicateCode(code);
                var codesInSchema = _repository.GetCodesBySchema(schemaId);
                var allGroupCodes = _repository.GetAllGroupCodes();

                _repository.Save();
            }
            catch (Exception ex)
            {
                exceptions.Add(ex);
            }
        })).ToArray();

        await Task.WhenAll(tasks);

        // Assert
        Assert.Empty(exceptions);
    }

    /// <summary>
    /// TC-12 (Failure Mode 4): Empty/Null RoomCode Guard
    /// Kiểm tra các trường hợp null, empty, whitespace không gây crash hoặc ô nhiễm cache.
    /// </summary>
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void TC12_FailureMode4_EmptyOrNullRoomCode_ReturnsEmptyAndRejectsRegistration(string? emptyCode)
    {
        // Arrange & Act
        var schemas = _repository.GetSchemaIdsByCode(emptyCode!);
        var hasDup = _repository.HasDuplicateCode(emptyCode!);
        var singleSchema = _repository.GetSchemaIdByCode(emptyCode!);

        var regResult = _repository.RegisterCodes("lusaco", emptyCode != null ? new[] { emptyCode } : Array.Empty<string>());

        // Assert
        Assert.Empty(schemas);
        Assert.False(hasDup);
        Assert.Null(singleSchema);
        Assert.False(regResult.IsSuccess);
    }

    /// <summary>
    /// Kiểm tra xóa mã phòng khỏi nhóm (RemoveCodes).
    /// </summary>
    [Fact]
    public void RemoveCodes_ValidCode_RemovesFromGroupAndCache()
    {
        // Arrange
        var schemaId = "nt_home";
        var code = "REMOVE_ME_99";
        _repository.RegisterCodes(schemaId, new[] { code });
        Assert.Contains(schemaId, _repository.GetSchemaIdsByCode(code));

        // Act
        var removeResult = _repository.RemoveCodes(schemaId, new[] { code });

        // Assert
        Assert.True(removeResult.IsSuccess);
        Assert.DoesNotContain(schemaId, _repository.GetSchemaIdsByCode(code));
    }
}
