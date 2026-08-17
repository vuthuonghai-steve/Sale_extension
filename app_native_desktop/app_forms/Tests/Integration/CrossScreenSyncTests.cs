using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Contracts.Schemas;
using AppForms.Backend.Services;
using AppForms.Frontend.Screens.LeadConverter.Hooks;
using AppForms.Frontend.Screens.Settings.Hooks;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace AppForms.Tests.Integration;

public class CrossScreenSyncTests
{
    private readonly JsonRoomCodeRepository _sharedRepository;
    private readonly Mock<IFormConverterService> _mockConverter;
    private readonly Mock<ISchemaManager> _mockSchemaManager;
    private readonly Mock<ITemplateEngine> _mockTemplateEngine;
    private readonly Mock<ISettingsService> _mockSettingsService;
    private readonly SchemaDetectorService _detector;

    private readonly LeadConverterStateHook _leadConverterHook;
    private readonly SettingsStateHook _settingsHook;

    public CrossScreenSyncTests()
    {
        var tempFile = Path.Combine(Path.GetTempPath(), $"test_room_codes_{Guid.NewGuid():N}.json");
        _sharedRepository = new JsonRoomCodeRepository(NullLogger<JsonRoomCodeRepository>.Instance, tempFile);
        _detector = new SchemaDetectorService(_sharedRepository);

        _mockConverter = new Mock<IFormConverterService>();
        _mockSchemaManager = new Mock<ISchemaManager>();
        _mockTemplateEngine = new Mock<ITemplateEngine>();
        _mockSettingsService = new Mock<ISettingsService>();

        _mockSettingsService.Setup(s => s.Current).Returns(new AppSettings
        {
            FixedCtvName = "Steve",
            DefaultSelectedSchemaId = "tl21_house"
        });

        _mockSchemaManager.Setup(m => m.Schemas).Returns(DefaultSchemas.GetAllDefaultSchemas());
        foreach (var s in DefaultSchemas.GetAllDefaultSchemas())
        {
            _mockSchemaManager.Setup(m => m.GetSchemaById(s.Id)).Returns(s);
        }

        _leadConverterHook = new LeadConverterStateHook(
            _mockConverter.Object,
            _mockSchemaManager.Object,
            _mockTemplateEngine.Object,
            _mockSettingsService.Object,
            _detector,
            _sharedRepository);

        _settingsHook = new SettingsStateHook(
            _mockSettingsService.Object,
            _sharedRepository);
    }

    /// <summary>
    /// TC-13 (Failure Mode 5): Cross-Screen Sync / Cache Reload
    /// Thao tác thêm mã phòng mới từ màn hình LeadConverterScreen (thông qua StateHook/Quick Add)
    /// phải được đồng bộ ngay lập tức và hiển thị trong SettingsScreen khi nạp lại.
    /// </summary>
    [Fact]
    public void TC13_FailureMode5_CrossScreenSync_AddCodeInLeadConverter_ImmediatelyVisibleInSettings()
    {
        // Arrange
        var newCode = "CROSS_SCREEN_ROOM_999";
        var targetSchemaId = "lusaco";

        // 1. Initial check in SettingsScreen: Code does not exist in Lusaco group
        _settingsHook.LoadRoomCodes();
        var initialLusacoGroup = _settingsHook.AvailableGroups.FirstOrDefault(g => g.SchemaId == targetSchemaId);
        Assert.NotNull(initialLusacoGroup);
        Assert.DoesNotContain(newCode, initialLusacoGroup!.Codes);

        // 2. Add Code quickly from LeadConverter Screen
        var addSuccess = _leadConverterHook.ConfirmAddRoomCode(newCode, targetSchemaId);
        Assert.True(addSuccess);

        // 3. Reload in Settings Screen
        _settingsHook.LoadRoomCodes();
        var updatedLusacoGroup = _settingsHook.AvailableGroups.FirstOrDefault(g => g.SchemaId == targetSchemaId);

        // Assert
        Assert.NotNull(updatedLusacoGroup);
        Assert.Contains(newCode, updatedLusacoGroup!.Codes);

        // 4. Tra cứu ngược lại từ LeadConverter: Giờ đây mã phòng đã được nhận diện ExactMatch
        var testLead = new LeadEntity { RoomCode = newCode };
        var detection = _detector.DetectSchemaWithDetails(testLead);
        Assert.Equal(AppForms.Shared.Enums.SchemaDetectionStatus.ExactMatch, detection.Status);
        Assert.Equal(targetSchemaId, detection.MatchedSchemaId);
    }

    /// <summary>
    /// Thao tác thêm mã từ SettingsScreen (SettingsStateHook) cũng được nhận diện ngay lập tức trong LeadConverterScreen.
    /// </summary>
    [Fact]
    public void TC13_FailureMode5_CrossScreenSync_AddCodeInSettings_ImmediatelyDetectedInLeadConverter()
    {
        // Arrange
        var newCode = "SETTINGS_ADDED_ROOM_888";
        var targetSchemaId = "hd_homes";

        // Act: Add from Settings
        _settingsHook.AddCodes(targetSchemaId, newCode);

        // LeadConverter processes lead with this room code
        var testLead = new LeadEntity { RoomCode = newCode };
        var detection = _detector.DetectSchemaWithDetails(testLead);

        // Assert
        Assert.Equal(AppForms.Shared.Enums.SchemaDetectionStatus.ExactMatch, detection.Status);
        Assert.Equal(targetSchemaId, detection.MatchedSchemaId);
    }
}
