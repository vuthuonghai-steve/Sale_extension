using AppForms.Backend.Adapters.Win32;
using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Contracts.Schemas;
using AppForms.Backend.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace AppForms.Tests.Backend;

public class FormConverterServiceTests
{
    private readonly Mock<ITextSanitizer> _mockSanitizer;
    private readonly Mock<IMessageParser> _mockParser;
    private readonly Mock<ITemplateEngine> _mockTemplateEngine;
    private readonly Mock<ISchemaManager> _mockSchemaManager;
    private readonly Mock<ISettingsService> _mockSettingsService;
    private readonly Mock<ISchemaDetector> _mockSchemaDetector;
    private readonly Win32ClipboardListener _win32Listener;
    private readonly FormConverterService _service;

    public FormConverterServiceTests()
    {
        _mockSanitizer = new Mock<ITextSanitizer>();
        _mockParser = new Mock<IMessageParser>();
        _mockTemplateEngine = new Mock<ITemplateEngine>();
        _mockSchemaManager = new Mock<ISchemaManager>();
        _mockSettingsService = new Mock<ISettingsService>();
        _mockSchemaDetector = new Mock<ISchemaDetector>();

        _mockSanitizer.Setup(s => s.Sanitize(It.IsAny<string>())).Returns<string>(s => s);
        _mockParser.Setup(p => p.Parse(It.IsAny<string>())).Returns(new LeadEntity { RoomCode = "ROOM_TEST" });
        _mockSchemaManager.Setup(m => m.Schemas).Returns(DefaultSchemas.GetAllDefaultSchemas());
        _mockSettingsService.Setup(s => s.Current).Returns(new AppSettings
        {
            FixedCtvName = "Test CTV",
            DefaultSelectedSchemaId = "tl21_house",
            MaxHistoryCount = 20
        });

        _win32Listener = new Win32ClipboardListener(NullLogger<Win32ClipboardListener>.Instance);

        _service = new FormConverterService(
            NullLogger<FormConverterService>.Instance,
            _mockSanitizer.Object,
            _mockParser.Object,
            _mockTemplateEngine.Object,
            _mockSchemaManager.Object,
            _mockSettingsService.Object,
            _mockSchemaDetector.Object,
            _win32Listener);
    }

    /// <summary>
    /// TC-05: FormConverterService loại bỏ Fallback ngầm
    /// Khi không phát hiện được SchemaId (detector trả về null) và không truyền targetSchemaId,
    /// SelectedSchemaId phải là null (KHÔNG fallback về DefaultSelectedSchemaId = 'tl21_house').
    /// </summary>
    [Fact]
    public void TC05_ProcessRawInput_UnidentifiedSchema_SelectedSchemaIdIsNull_NoSilentFallback()
    {
        // Arrange
        var rawInput = "Tin nhắn lead không xác định";
        _mockSchemaDetector.Setup(d => d.DetectSchemaId(It.IsAny<LeadEntity>(), rawInput))
            .Returns((string?)null);

        // Act
        var result = _service.ProcessRawInput(rawInput);

        // Assert
        Assert.Null(result.SelectedSchemaId);
    }

    /// <summary>
    /// Khi detector phát hiện đúng SchemaId, SelectedSchemaId lấy theo detector.
    /// </summary>
    [Fact]
    public void ProcessRawInput_DetectedSchema_SelectedSchemaIdMatchesDetector()
    {
        // Arrange
        var rawInput = "Tin nhắn lead Lusaco";
        _mockSchemaDetector.Setup(d => d.DetectSchemaId(It.IsAny<LeadEntity>(), rawInput))
            .Returns("lusaco");

        // Act
        var result = _service.ProcessRawInput(rawInput);

        // Assert
        Assert.Equal("lusaco", result.SelectedSchemaId);
    }

    /// <summary>
    /// Khi truyền targetSchemaId rõ ràng (User chọn thủ công), SelectedSchemaId ưu tiên theo targetSchemaId.
    /// </summary>
    [Fact]
    public void ProcessRawInput_ExplicitTargetSchemaId_OverridesDetectedSchema()
    {
        // Arrange
        var rawInput = "Tin nhắn";
        _mockSchemaDetector.Setup(d => d.DetectSchemaId(It.IsAny<LeadEntity>(), rawInput))
            .Returns("lusaco");

        // Act
        var result = _service.ProcessRawInput(rawInput, targetSchemaId: "hd_homes");

        // Assert
        Assert.Equal("hd_homes", result.SelectedSchemaId);
    }
}
