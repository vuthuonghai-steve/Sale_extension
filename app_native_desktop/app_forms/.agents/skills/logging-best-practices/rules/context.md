---
title: Context, Cardinality, and Dimensionality
impact: CRITICAL
tags: logging, context, cardinality, dimensionality, serilog, csharp
---

# Context, Cardinality, and Dimensionality

**Impact: CRITICAL**

Wide events must be context-rich with high cardinality and high dimensionality. This enables answering questions you haven't anticipated yet — the "unknown unknowns" that traditional fragmented logging misses.

## High Cardinality

High cardinality means a field can have thousands, millions, or billions of unique values. Customer names, phone hashes, session IDs, schema IDs, and transaction IDs are high cardinality fields.

Your logging must support querying against any specific value of these fields. Without high cardinality support, you cannot isolate problems for a specific customer or transaction.

```csharp
// High Cardinality Fields in Serilog
_logger.LogInformation("Processing lead conversion for Session: {SessionId}, Schema: {SchemaId}, CustomerRef: {CustomerRef}",
    sessionContext.SessionId,
    schema.Id,
    lead.CustomerRef);
```

## High Dimensionality

High dimensionality means each event contains many fields (15-50+ properties). More dimensions mean more investigative power without needing to redeploy or recreate conditions.

```csharp
var wideEvent = new
{
    // Timing & Identifiers
    Timestamp = DateTimeOffset.UtcNow,
    DurationMs = elapsedMs,
    SessionId = AppSession.CurrentId,
    TraceId = Guid.NewGuid().ToString("N"),

    // Component & Layer Context
    Layer = "1_Backend",
    Service = nameof(FormConverterService),
    AssemblyVersion = AppConstants.Version,

    // High Cardinality & Business Context
    CustomerName = lead.CustomerName,
    PhoneCount = lead.PhoneNumbers.Count,
    DetectedSchemaId = schema.Id,
    SchemaConfidence = schemaMatch.Confidence,
    RawCharCount = rawText.Length,
    OutputCharCount = renderedOutput.Length,

    // Environment Context
    MachineName = Environment.MachineName,
    OSVersion = Environment.OSVersion.VersionString,
    ProcessId = Environment.ProcessId,

    // Outcome
    StatusCode = 200,
    Outcome = "Success"
};

_logger.LogInformation("Operation completed {@WideEvent}", wideEvent);
```

## Always Include Business Context

Include business-specific context, not just technical details. The goal is to know:
> "Khách hàng VIP 'Nguyễn Văn A' chuyển đổi thất bại do Schema 'Chuyển hàng COD' thiếu trường Tiền thu hộ"

Thay vì chỉ thấy log kỹ thuật chung chung:
> "Conversion failed with NullReferenceException"

```csharp
// Business Context in Log
_logger.LogWarning("Schema validation mismatch for Schema: {SchemaName} (Category: {Category}). Missing mandatory fields: {@MissingFields}",
    schema.Name,
    schema.Category,
    validationResult.MissingFields);
```

## Always Include Environment Characteristics

Include environment and deployment information in every structured log session or wide event. This is essential for correlating bugs with specific builds and Windows configurations.

**Environment fields to capture:**
- `AppVersion`: e.g. `1.2.0`
- `CommitSha`: e.g. `a1b2c3d`
- `OSVersion`: e.g. `Windows 11 Build 22631`
- `RuntimeVersion`: e.g. `.NET 6.0.36`
- `ProcessArchitecture`: e.g. `X64`
- `IsElevated`: `true` / `false`

These properties should be configured globally in `Program.cs` via Serilog Enrichers:

```csharp
Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "AppForms")
    .Enrich.WithProperty("Version", AppConstants.Version)
    .Enrich.WithProperty("MachineName", Environment.MachineName)
    .Enrich.WithProperty("ProcessId", Environment.ProcessId)
    .CreateLogger();
```
