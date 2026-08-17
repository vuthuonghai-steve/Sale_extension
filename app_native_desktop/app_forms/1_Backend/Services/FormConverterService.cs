using AppForms.Backend.Adapters.Win32;
using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Shared.Common;
using Microsoft.Extensions.Logging;

namespace AppForms.Backend.Services;

public class FormConverterService : IFormConverterService, IDisposable
{
    private readonly ILogger<FormConverterService> _logger;
    private readonly ITextSanitizer _sanitizer;
    private readonly IMessageParser _parser;
    private readonly ITemplateEngine _templateEngine;
    private readonly ISchemaManager _schemaManager;
    private readonly ISettingsService _settingsService;
    private readonly Win32ClipboardListener _win32Listener;

    private readonly List<ConversionItem> _history = new();
    private string _lastCapturedClipboardText = string.Empty;
    private bool _isInternalClipboardSet;

    public event EventHandler<ConversionItem>? Converted;
    public event EventHandler<bool>? ClipboardListeningStateChanged;

    public bool IsClipboardListening { get; private set; }

    public IReadOnlyList<ConversionItem> History
    {
        get
        {
            lock (_history)
            {
                return _history.ToList();
            }
        }
    }

    private readonly ISchemaDetector _schemaDetector;

    public FormConverterService(
        ILogger<FormConverterService> logger,
        ITextSanitizer sanitizer,
        IMessageParser parser,
        ITemplateEngine templateEngine,
        ISchemaManager schemaManager,
        ISettingsService settingsService,
        ISchemaDetector schemaDetector,
        Win32ClipboardListener win32Listener)
    {
        _logger = logger;
        _sanitizer = sanitizer;
        _parser = parser;
        _templateEngine = templateEngine;
        _schemaManager = schemaManager;
        _settingsService = settingsService;
        _schemaDetector = schemaDetector;
        _win32Listener = win32Listener;

        _win32Listener.ClipboardUpdated += OnClipboardUpdated;
    }

    public ConversionItem ProcessRawInput(string rawInput, string? targetSchemaId = null)
    {
        var sanitized = _sanitizer.Sanitize(rawInput);
        var lead = _parser.Parse(sanitized);

        return ProcessLeadInternal(lead, rawInput, targetSchemaId);
    }

    public ConversionItem ProcessLead(LeadEntity lead, string? targetSchemaId = null)
    {
        return ProcessLeadInternal(lead, string.Empty, targetSchemaId);
    }

    private ConversionItem ProcessLeadInternal(LeadEntity lead, string rawInput, string? targetSchemaId)
    {
        var fixedCtv = _settingsService.Current.FixedCtvName;
        // Ưu tiên: targetSchemaId truyền vào -> Auto-detect từ lead/rawInput (loại bỏ fallback ngầm DefaultSelectedSchemaId)
        var detectedSchemaId = _schemaDetector.DetectSchemaId(lead, rawInput);
        var selectedSchemaId = targetSchemaId ?? detectedSchemaId;
        var allSchemas = _schemaManager.Schemas;

        var outputs = _templateEngine.RenderAll(lead, allSchemas, fixedCtv);

        var item = new ConversionItem
        {
            RawInput = rawInput,
            Lead = lead,
            FormattedOutputs = outputs,
            SelectedSchemaId = selectedSchemaId,
            ConvertedAt = DateTime.Now
        };

        lock (_history)
        {
            _history.Insert(0, item);
            var max = _settingsService.Current.MaxHistoryCount;
            if (_history.Count > max)
            {
                _history.RemoveRange(max, _history.Count - max);
            }
        }

        Converted?.Invoke(this, item);
        return item;
    }

    public Result StartClipboardMonitor(IntPtr windowHandle)
    {
        if (IsClipboardListening) return Result.Success();

        var success = _win32Listener.Start();
        if (success)
        {
            IsClipboardListening = true;
            ClipboardListeningStateChanged?.Invoke(this, true);
            _logger.LogInformation("Đã bắt đầu theo dõi Clipboard.");
            return Result.Success();
        }

        return Result.Failure("Không thể bắt đầu lắng nghe Clipboard từ Windows.");
    }

    public Result StopClipboardMonitor(IntPtr windowHandle)
    {
        if (!IsClipboardListening) return Result.Success();

        _win32Listener.Stop();
        IsClipboardListening = false;
        ClipboardListeningStateChanged?.Invoke(this, false);
        _logger.LogInformation("Đã tạm dừng theo dõi Clipboard.");
        return Result.Success();
    }

    public Result CopyToClipboard(string text)
    {
        try
        {
            _isInternalClipboardSet = true;
            _lastCapturedClipboardText = text;
            Clipboard.SetText(text);
            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi sao chép vào Clipboard");
            return Result.Failure(ex.Message);
        }
        finally
        {
            _isInternalClipboardSet = false;
        }
    }

    public Result ClearHistory()
    {
        lock (_history)
        {
            _history.Clear();
        }
        return Result.Success();
    }

    private void OnClipboardUpdated(object? sender, EventArgs e)
    {
        if (_isInternalClipboardSet) return;

        try
        {
            if (!Clipboard.ContainsText()) return;

            var text = Clipboard.GetText();
            if (string.IsNullOrWhiteSpace(text) || string.Equals(text, _lastCapturedClipboardText, StringComparison.Ordinal))
            {
                return;
            }

            _lastCapturedClipboardText = text;
            _logger.LogInformation("Đã bắt được Clipboard mới ({Length} ký tự)", text.Length);

            ProcessRawInput(text);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Lỗi đọc nội dung Clipboard");
        }
    }

    public void Dispose()
    {
        _win32Listener.ClipboardUpdated -= OnClipboardUpdated;
        _win32Listener.Dispose();
        GC.SuppressFinalize(this);
    }
}
