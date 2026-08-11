using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Interfaces;

namespace AppForms.Frontend.Screens.LeadConverter.Hooks;

public class LeadConverterStateHook
{
    private readonly IFormConverterService _converterService;
    private readonly ISchemaManager _schemaManager;
    private readonly ITemplateEngine _templateEngine;
    private readonly ISettingsService _settingsService;

    private readonly ISchemaDetector _schemaDetector;

    public string ActiveSchemaId { get; private set; }
    public LeadEntity CurrentLead { get; private set; } = new();
    public string FormattedOutput { get; private set; } = string.Empty;
    public bool IsSyncingInternally { get; set; }

    public event Action? StateChanged;
    public event Action<string>? SchemaAutoDetected;

    public LeadConverterStateHook(
        IFormConverterService converterService,
        ISchemaManager schemaManager,
        ITemplateEngine templateEngine,
        ISettingsService settingsService,
        ISchemaDetector schemaDetector)
    {
        _converterService = converterService;
        _schemaManager = schemaManager;
        _templateEngine = templateEngine;
        _settingsService = settingsService;
        _schemaDetector = schemaDetector;

        ActiveSchemaId = _settingsService.Current.DefaultSelectedSchemaId;
    }

    public void SetActiveSchema(string schemaId)
    {
        ActiveSchemaId = schemaId;
        RecalculateOutput();
    }

    public void ProcessRawInput(string rawInput)
    {
        if (string.IsNullOrWhiteSpace(rawInput)) return;

        var item = _converterService.ProcessRawInput(rawInput);
        CurrentLead = item.Lead;

        // Nếu phát hiện schema tự động khớp mã sàn (Mn -> lusaco, Ts -> hd_homes, NT -> nt_home...)
        var detectedSchema = _schemaDetector.DetectSchemaId(CurrentLead, rawInput);
        if (!string.IsNullOrEmpty(detectedSchema) && !string.Equals(detectedSchema, ActiveSchemaId, StringComparison.OrdinalIgnoreCase))
        {
            ActiveSchemaId = detectedSchema;
            SchemaAutoDetected?.Invoke(detectedSchema);
        }

        RecalculateOutput();
    }

    public void UpdateLeadFields(LeadEntity lead)
    {
        CurrentLead = lead;

        // Nếu người dùng nhập mã phòng trong editor, kiểm tra tự động đổi schema nếu khớp
        var detectedSchema = _schemaDetector.DetectSchemaId(CurrentLead);
        if (!string.IsNullOrEmpty(detectedSchema) && !string.Equals(detectedSchema, ActiveSchemaId, StringComparison.OrdinalIgnoreCase))
        {
            ActiveSchemaId = detectedSchema;
            SchemaAutoDetected?.Invoke(detectedSchema);
        }

        RecalculateOutput();
    }

    public void RecalculateOutput()
    {
        var schema = _schemaManager.GetSchemaById(ActiveSchemaId) ?? _schemaManager.Schemas.First();
        var fixedCtv = _settingsService.Current.FixedCtvName;
        FormattedOutput = _templateEngine.Render(CurrentLead, schema, fixedCtv);
        StateChanged?.Invoke();
    }

    public bool CopyOutputToClipboard()
    {
        if (string.IsNullOrWhiteSpace(FormattedOutput)) return false;
        var res = _converterService.CopyToClipboard(FormattedOutput);
        return res.IsSuccess;
    }
}
