using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Shared.Enums;

namespace AppForms.Frontend.Screens.LeadConverter.Hooks;

public class LeadConverterStateHook
{
    private readonly IFormConverterService _converterService;
    private readonly ISchemaManager _schemaManager;
    private readonly ITemplateEngine _templateEngine;
    private readonly ISettingsService _settingsService;
    private readonly ISchemaDetector _schemaDetector;
    private readonly IRoomCodeRepository _roomCodeRepo;

    public string? ActiveSchemaId { get; private set; }
    public LeadEntity CurrentLead { get; private set; } = new();
    public string FormattedOutput { get; private set; } = string.Empty;
    public SchemaDetectionResult CurrentDetectionResult { get; private set; } = new();
    public bool IsAddCodeButtonEnabled { get; private set; }
    public bool IsSyncingInternally { get; set; }

    public event Action? StateChanged;
    public event Action<string>? SchemaAutoDetected;
    public event Action<SchemaDetectionResult>? DetectionResultChanged;
    public event Action<string, bool>? OperationFeedback;

    public LeadConverterStateHook(
        IFormConverterService converterService,
        ISchemaManager schemaManager,
        ITemplateEngine templateEngine,
        ISettingsService settingsService,
        ISchemaDetector schemaDetector,
        IRoomCodeRepository roomCodeRepo)
    {
        _converterService = converterService;
        _schemaManager = schemaManager;
        _templateEngine = templateEngine;
        _settingsService = settingsService;
        _schemaDetector = schemaDetector;
        _roomCodeRepo = roomCodeRepo;

        ActiveSchemaId = null;
    }

    public void SetActiveSchema(string? schemaId)
    {
        ActiveSchemaId = schemaId;
        if (!string.IsNullOrEmpty(schemaId) && CurrentDetectionResult.Status != SchemaDetectionStatus.ExactMatch)
        {
            CurrentDetectionResult = new SchemaDetectionResult
            {
                Status = SchemaDetectionStatus.ManualSelected,
                MatchedSchemaId = schemaId,
                CandidateSchemaIds = new[] { schemaId }
            };
            DetectionResultChanged?.Invoke(CurrentDetectionResult);
        }

        UpdateAddCodeButtonState();
        RecalculateOutput();
    }

    public void ProcessRawInput(string rawInput)
    {
        if (string.IsNullOrWhiteSpace(rawInput))
        {
            CurrentLead = new LeadEntity();
            ActiveSchemaId = null;
            CurrentDetectionResult = new SchemaDetectionResult();
            UpdateAddCodeButtonState();
            DetectionResultChanged?.Invoke(CurrentDetectionResult);
            RecalculateOutput();
            return;
        }

        var item = _converterService.ProcessRawInput(rawInput);
        CurrentLead = item.Lead;

        var detection = _schemaDetector.DetectSchemaWithDetails(CurrentLead, rawInput) ?? SchemaDetectionResult.NotFoundResult();
        CurrentDetectionResult = detection;

        if (detection.Status == SchemaDetectionStatus.ExactMatch && !string.IsNullOrEmpty(detection.MatchedSchemaId))
        {
            ActiveSchemaId = detection.MatchedSchemaId;
            SchemaAutoDetected?.Invoke(detection.MatchedSchemaId);
        }
        else if (detection.Status == SchemaDetectionStatus.AmbiguousConflict)
        {
            ActiveSchemaId = null;
        }
        else
        {
            ActiveSchemaId = null;
        }

        UpdateAddCodeButtonState();
        DetectionResultChanged?.Invoke(CurrentDetectionResult);
        RecalculateOutput();
    }

    public void UpdateLeadFields(LeadEntity lead)
    {
        CurrentLead = lead;

        var detection = _schemaDetector.DetectSchemaWithDetails(CurrentLead) ?? SchemaDetectionResult.NotFoundResult();
        CurrentDetectionResult = detection;

        if (detection.Status == SchemaDetectionStatus.ExactMatch && !string.IsNullOrEmpty(detection.MatchedSchemaId))
        {
            ActiveSchemaId = detection.MatchedSchemaId;
            SchemaAutoDetected?.Invoke(detection.MatchedSchemaId);
        }
        else if (detection.Status == SchemaDetectionStatus.AmbiguousConflict)
        {
            ActiveSchemaId = null;
        }

        UpdateAddCodeButtonState();
        DetectionResultChanged?.Invoke(CurrentDetectionResult);
        RecalculateOutput();
    }

    public bool ConfirmAddRoomCode(string roomCode, string schemaId)
    {
        if (string.IsNullOrWhiteSpace(roomCode) || string.IsNullOrWhiteSpace(schemaId))
        {
            OperationFeedback?.Invoke("Mã phòng hoặc sàn không hợp lệ.", false);
            return false;
        }

        var result = _roomCodeRepo.RegisterCodes(schemaId, new[] { roomCode });
        if (result.IsSuccess)
        {
            ActiveSchemaId = schemaId;
            CurrentDetectionResult = SchemaDetectionResult.Exact(schemaId);

            UpdateAddCodeButtonState();
            DetectionResultChanged?.Invoke(CurrentDetectionResult);
            RecalculateOutput();

            var groupName = _roomCodeRepo.GetGroupName(schemaId) ?? schemaId;
            OperationFeedback?.Invoke($"Đã thêm mã '{roomCode}' vào nhóm '{groupName}' thành công!", true);
            return true;
        }

        OperationFeedback?.Invoke($"Lỗi thêm mã: {result.Error}", false);
        return false;
    }

    public void RecalculateOutput()
    {
        if (!string.IsNullOrEmpty(ActiveSchemaId))
        {
            var schema = _schemaManager.GetSchemaById(ActiveSchemaId);
            if (schema != null)
            {
                var fixedCtv = _settingsService.Current.FixedCtvName;
                FormattedOutput = _templateEngine.Render(CurrentLead, schema, fixedCtv);
            }
            else
            {
                FormattedOutput = string.Empty;
            }
        }
        else
        {
            if (CurrentDetectionResult.Status == SchemaDetectionStatus.AmbiguousConflict)
            {
                FormattedOutput = $"⚠️ {CurrentDetectionResult.ConflictMessage ?? "Mã phòng trùng giữa nhiều sàn. Vui lòng chọn sàn thủ công ở danh sách trên."}";
            }
            else if (CurrentDetectionResult.Status == SchemaDetectionStatus.NotFound && !string.IsNullOrWhiteSpace(CurrentLead.RoomCode))
            {
                FormattedOutput = "⚠️ Chưa nhận diện được mẫu sàn phù hợp từ mã phòng.\nVui lòng chọn sàn ở danh sách trên hoặc bấm '➕ Thêm mã' để đăng ký mới.";
            }
            else
            {
                FormattedOutput = string.Empty;
            }
        }

        StateChanged?.Invoke();
    }

    private void UpdateAddCodeButtonState()
    {
        if (string.IsNullOrWhiteSpace(CurrentLead.RoomCode) || string.IsNullOrWhiteSpace(ActiveSchemaId))
        {
            IsAddCodeButtonEnabled = false;
            return;
        }

        var existingCodes = _roomCodeRepo.GetCodesBySchema(ActiveSchemaId);
        var isAlreadyRegistered = existingCodes.Any(c => c.Equals(CurrentLead.RoomCode.Trim(), StringComparison.OrdinalIgnoreCase));
        IsAddCodeButtonEnabled = !isAlreadyRegistered;
    }

    public bool CopyOutputToClipboard()
    {
        if (string.IsNullOrWhiteSpace(FormattedOutput) || FormattedOutput.StartsWith("⚠️"))
        {
            return false;
        }

        var res = _converterService.CopyToClipboard(FormattedOutput);
        return res.IsSuccess;
    }
}
