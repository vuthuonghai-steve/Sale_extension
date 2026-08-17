using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Contracts.Schemas;
using AppForms.Frontend.Screens.LeadConverter.Hooks;
using AppForms.Shared.Common;
using AppForms.Shared.Enums;
using Moq;
using Xunit;

namespace AppForms.Tests.Frontend;

public class LeadConverterStateHookTests
{
    private readonly Mock<IFormConverterService> _mockConverter;
    private readonly Mock<ISchemaManager> _mockSchemaManager;
    private readonly Mock<ITemplateEngine> _mockTemplateEngine;
    private readonly Mock<ISettingsService> _mockSettingsService;
    private readonly Mock<ISchemaDetector> _mockDetector;
    private readonly Mock<IRoomCodeRepository> _mockRoomRepo;
    private readonly LeadConverterStateHook _hook;

    public LeadConverterStateHookTests()
    {
        _mockConverter = new Mock<IFormConverterService>();
        _mockSchemaManager = new Mock<ISchemaManager>();
        _mockTemplateEngine = new Mock<ITemplateEngine>();
        _mockSettingsService = new Mock<ISettingsService>();
        _mockDetector = new Mock<ISchemaDetector>();
        _mockRoomRepo = new Mock<IRoomCodeRepository>();

        _mockSettingsService.Setup(s => s.Current).Returns(new AppSettings
        {
            FixedCtvName = "Steve",
            DefaultSelectedSchemaId = "tl21_house"
        });

        var sampleSchema = DefaultSchemas.GetAllDefaultSchemas().First(s => s.Id == "lusaco");
        _mockSchemaManager.Setup(m => m.GetSchemaById("lusaco")).Returns(sampleSchema);
        _mockSchemaManager.Setup(m => m.Schemas).Returns(DefaultSchemas.GetAllDefaultSchemas());

        _mockRoomRepo.Setup(r => r.GetGroupName("lusaco")).Returns("Sàn Lusaco");
        _mockRoomRepo.Setup(r => r.GetCodesBySchema("lusaco")).Returns(new List<string> { "EXISTING_CODE_1" });

        _hook = new LeadConverterStateHook(
            _mockConverter.Object,
            _mockSchemaManager.Object,
            _mockTemplateEngine.Object,
            _mockSettingsService.Object,
            _mockDetector.Object,
            _mockRoomRepo.Object);
    }

    /// <summary>
    /// TC-06: StateHook Null ActiveSchemaId
    /// Khởi tạo ActiveSchemaId == null. Khi tin nhắn không nhận diện được sàn hoặc bị trùng mã,
    /// ActiveSchemaId giữ null và FormattedOutput hiển thị cảnh báo/hướng dẫn thay vì render ngầm.
    /// </summary>
    [Fact]
    public void TC06_InitialState_ActiveSchemaIdIsNull_And_UnidentifiedLead_ShowsInstructionOutput()
    {
        // 1. Initial State
        Assert.Null(_hook.ActiveSchemaId);
        Assert.False(_hook.IsAddCodeButtonEnabled);

        // 2. Process Unidentified Lead
        var lead = new LeadEntity { RoomCode = "NEW_UNKNOWN_512" };
        var convItem = new ConversionItem { Lead = lead };
        _mockConverter.Setup(c => c.ProcessRawInput("raw text", It.IsAny<string?>())).Returns(convItem);
        _mockDetector.Setup(d => d.DetectSchemaWithDetails(lead, "raw text"))
            .Returns(SchemaDetectionResult.NotFoundResult("Chưa nhận diện sàn"));

        _hook.ProcessRawInput("raw text");

        // Assert
        Assert.Null(_hook.ActiveSchemaId);
        Assert.Equal(SchemaDetectionStatus.NotFound, _hook.CurrentDetectionResult.Status);
        Assert.Contains("⚠️ Chưa nhận diện", _hook.FormattedOutput);
    }

    /// <summary>
    /// TC-06: Khi trùng mã (AmbiguousConflict), ActiveSchemaId == null và FormattedOutput hiển thị cảnh báo trùng mã.
    /// </summary>
    [Fact]
    public void TC06_AmbiguousConflict_ActiveSchemaIdIsNull_ShowsConflictWarning()
    {
        // Arrange
        var lead = new LeadEntity { RoomCode = "302" };
        var convItem = new ConversionItem { Lead = lead };
        _mockConverter.Setup(c => c.ProcessRawInput("raw text 302", It.IsAny<string?>())).Returns(convItem);
        _mockDetector.Setup(d => d.DetectSchemaWithDetails(lead, "raw text 302"))
            .Returns(SchemaDetectionResult.Conflict(new[] { "lusaco", "hd_homes" }, "Mã 302 thuộc Lusaco và HD Homes"));

        // Act
        _hook.ProcessRawInput("raw text 302");

        // Assert
        Assert.Null(_hook.ActiveSchemaId);
        Assert.Equal(SchemaDetectionStatus.AmbiguousConflict, _hook.CurrentDetectionResult.Status);
        Assert.Contains("⚠️", _hook.FormattedOutput);
        Assert.Contains("Mã 302 thuộc Lusaco và HD Homes", _hook.FormattedOutput);
    }

    /// <summary>
    /// TC-07: SchemaSelectorTabs Quick Add Button Enable/Disable
    /// Button Thêm mã chỉ được enable khi:
    /// - Lead có RoomCode hợp lệ (khác rỗng)
    /// - Đã chọn ActiveSchemaId
    /// - Mã phòng chưa có trong nhóm sàn đang chọn.
    /// </summary>
    [Fact]
    public void TC07_QuickAddButton_EnableStateLogic()
    {
        // Case A: RoomCode có, nhưng chưa chọn sàn -> Disabled
        var lead = new LeadEntity { RoomCode = "NEW_ROOM_888" };
        var convItem = new ConversionItem { Lead = lead };
        _mockConverter.Setup(c => c.ProcessRawInput("raw", It.IsAny<string?>())).Returns(convItem);
        _mockDetector.Setup(d => d.DetectSchemaWithDetails(lead, "raw"))
            .Returns(SchemaDetectionResult.NotFoundResult());

        _hook.ProcessRawInput("raw");
        Assert.False(_hook.IsAddCodeButtonEnabled);

        // Case B: User chọn sàn "lusaco", mã "NEW_ROOM_888" chưa tồn tại trong Lusaco -> Enabled
        _hook.SetActiveSchema("lusaco");
        Assert.True(_hook.IsAddCodeButtonEnabled);

        // Case C: User chuyển sang mã đã tồn tại "EXISTING_CODE_1" -> Disabled
        var existingLead = new LeadEntity { RoomCode = "EXISTING_CODE_1" };
        _hook.UpdateLeadFields(existingLead);
        Assert.False(_hook.IsAddCodeButtonEnabled);
    }

    /// <summary>
    /// TC-08: Confirmation Add Room Code Flow
    /// Khi ConfirmAddRoomCode được gọi, StateHook gọi repo.RegisterCodes, chuyển ActiveSchemaId về sàn đó,
    /// cập nhật ExactMatch và kích hoạt feedback thành công.
    /// </summary>
    [Fact]
    public void TC08_ConfirmAddRoomCode_SuccessFlow()
    {
        // Arrange
        var roomCode = "NEW_512";
        var schemaId = "lusaco";
        _mockRoomRepo.Setup(r => r.RegisterCodes(schemaId, It.Is<IEnumerable<string>>(c => c.Contains(roomCode))))
            .Returns(Result.Success());

        string? feedbackMsg = null;
        bool? feedbackSuccess = null;
        _hook.OperationFeedback += (msg, ok) =>
        {
            feedbackMsg = msg;
            feedbackSuccess = ok;
        };

        // Act
        var success = _hook.ConfirmAddRoomCode(roomCode, schemaId);

        // Assert
        Assert.True(success);
        Assert.Equal(schemaId, _hook.ActiveSchemaId);
        Assert.Equal(SchemaDetectionStatus.ExactMatch, _hook.CurrentDetectionResult.Status);
        Assert.NotNull(feedbackMsg);
        Assert.True(feedbackSuccess);
        Assert.Contains("Đã thêm mã 'NEW_512'", feedbackMsg);
        _mockRoomRepo.Verify(r => r.RegisterCodes(schemaId, It.IsAny<IEnumerable<string>>()), Times.Once);
    }

    /// <summary>
    /// TC-12: Empty/Null RoomCode Guard in ConfirmAddRoomCode
    /// </summary>
    [Theory]
    [InlineData("", "lusaco")]
    [InlineData("   ", "lusaco")]
    [InlineData("512", "")]
    [InlineData("512", "   ")]
    public void TC12_ConfirmAddRoomCode_InvalidInput_ReturnsFalseAndEmitsError(string roomCode, string schemaId)
    {
        // Act
        var success = _hook.ConfirmAddRoomCode(roomCode, schemaId);

        // Assert
        Assert.False(success);
        _mockRoomRepo.Verify(r => r.RegisterCodes(It.IsAny<string>(), It.IsAny<IEnumerable<string>>()), Times.Never);
    }
}
