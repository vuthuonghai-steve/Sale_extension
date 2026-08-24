using AppForms.Backend.Adapters.Persistence.Common;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace AppForms.Tests.Backend;

public class TestEntity
{
    public string Name { get; set; } = string.Empty;
    public int Value { get; set; }
}

public class AtomicJsonFileStorageTests : IDisposable
{
    private readonly string _testTempDir;
    private readonly string _testFilePath;
    private readonly AtomicJsonFileStorage<TestEntity> _storage;

    public AtomicJsonFileStorageTests()
    {
        _testTempDir = Path.Combine(Path.GetTempPath(), "AppForms_StorageTests_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_testTempDir);
        _testFilePath = Path.Combine(_testTempDir, "test_data.json");

        _storage = new AtomicJsonFileStorage<TestEntity>(
            NullLogger<AtomicJsonFileStorage<TestEntity>>.Instance,
            "test_data.json",
            _testFilePath);
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
        catch { }
    }

    [Fact]
    public void Save_And_Load_PersistsDataAtomically()
    {
        // Arrange
        var initial = new TestEntity { Name = "Sample", Value = 42 };

        // Act
        var saveResult = _storage.Save(initial);
        var loadResult = _storage.Load("non_existing_seed.json");

        // Assert
        Assert.True(saveResult.IsSuccess);
        Assert.True(loadResult.IsSuccess);
        Assert.NotNull(loadResult.Value);
        Assert.Equal("Sample", loadResult.Value.Name);
        Assert.Equal(42, loadResult.Value.Value);
    }

    [Fact]
    public void Load_WhenFileDoesNotExist_UsesDefaultFactory()
    {
        // Act
        var result = _storage.Load("non_existing_seed.json", () => new TestEntity { Name = "DefaultFactoryData", Value = 999 });

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal("DefaultFactoryData", result.Value.Name);
        Assert.Equal(999, result.Value.Value);
        Assert.True(File.Exists(_testFilePath), "Default factory data should be saved to disk immediately");
    }
}
