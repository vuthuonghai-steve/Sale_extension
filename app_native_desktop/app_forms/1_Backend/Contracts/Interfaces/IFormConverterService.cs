using AppForms.Backend.Contracts.Entities;
using AppForms.Shared.Common;

namespace AppForms.Backend.Contracts.Interfaces;

public interface ITextSanitizer
{
    string RemoveHiddenChars(string text);
    string CleanWhitespace(string text);
    string Sanitize(string text);
}

public interface IMessageParser
{
    LeadEntity Parse(string rawText);
    string? ExtractPhoneNumber(string text);
}

public interface ITemplateEngine
{
    string Render(LeadEntity lead, FormatSchema schema, string? fixedCtvName = null);
    Dictionary<string, string> RenderAll(LeadEntity lead, IEnumerable<FormatSchema> schemas, string? fixedCtvName = null);
}

public interface ISchemaManager
{
    IReadOnlyList<FormatSchema> Schemas { get; }
    FormatSchema? GetSchemaById(string id);
    Result RegisterSchema(FormatSchema schema);
}

public interface ISchemaDetector
{
    string? DetectSchemaId(LeadEntity lead, string? rawText = null);
    SchemaDetectionResult DetectSchemaWithDetails(LeadEntity lead, string? rawText = null);
}

public interface IFormConverterService
{
    event EventHandler<ConversionItem>? Converted;
    event EventHandler<bool>? ClipboardListeningStateChanged;

    bool IsClipboardListening { get; }
    IReadOnlyList<ConversionItem> History { get; }

    ConversionItem ProcessRawInput(string rawInput, string? targetSchemaId = null);
    ConversionItem ProcessLead(LeadEntity lead, string? targetSchemaId = null);
    Result StartClipboardMonitor(IntPtr windowHandle);
    Result StopClipboardMonitor(IntPtr windowHandle);
    Result CopyToClipboard(string text);
    Result ClearHistory();
}
