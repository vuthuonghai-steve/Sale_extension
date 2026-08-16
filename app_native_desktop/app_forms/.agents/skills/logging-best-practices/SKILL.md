---
name: logging-best-practices
description: Logging best practices focused on wide events (canonical log lines), structured Serilog logging, and high-cardinality telemetry for powerful debugging and observability.
license: MIT
metadata:
  author: 'Steve Void Team & Boris Tane'
  version: '1.0.0'
tags: [logging, serilog, wide-events, observability, structured-logging, csharp-winforms]
---

# Logging Best Practices Skill

Version: 1.0.0

## Purpose

This skill provides guidelines for implementing effective, structured, and observable logging in applications. It focuses on **wide events** (canonical log lines) and Serilog multi-sink structured logging — emitting context-rich events that enable seamless debugging, root-cause analysis, and system telemetry without creating log noise.

## When to Apply

Apply these guidelines when:

- Writing or reviewing logging code across `0_Shared`, `1_Backend`, and `2_Frontend`
- Configuring Serilog sinks (Console, Daily Rolling Log, Session Debug Log)
- Adding `_logger.LogInformation`, `_logger.LogError`, or structured diagnostic logs
- Designing telemetry, error tracking, and performance monitoring strategies

## Core Principles

### 1. Wide Events / Canonical Log Lines (CRITICAL)

Emit **one context-rich structured event per major operation or lifecycle step**. Instead of scattering 10 disconnected log statements throughout your method, consolidate key metadata and emit a single structured event upon completion.

```csharp
// C# / Serilog Wide Event Pattern
var stopwatch = Stopwatch.StartNew();
var operationContext = new Dictionary<string, object?>
{
    ["Operation"] = "FormConversion",
    ["SessionId"] = AppSession.CurrentId,
    ["Timestamp"] = DateTimeOffset.UtcNow,
    ["RawTextLength"] = rawInput.Length
};

try
{
    var detectedSchema = await _schemaDetector.DetectAsync(rawInput);
    operationContext["SchemaId"] = detectedSchema.Id;
    operationContext["SchemaConfidence"] = detectedSchema.Confidence;

    var lead = _parser.Parse(rawInput, detectedSchema);
    operationContext["CustomerName"] = lead.CustomerName;
    operationContext["PhoneCount"] = lead.PhoneNumbers.Count;

    var output = _templateEngine.Render(lead, detectedSchema);
    operationContext["OutputLength"] = output.Length;
    operationContext["Status"] = "Success";

    _logger.LogInformation("Form conversion completed {@OperationContext}", operationContext);
    return Result<string>.Success(output);
}
catch (Exception ex)
{
    operationContext["Status"] = "Failed";
    operationContext["ErrorType"] = ex.GetType().Name;
    operationContext["ErrorMessage"] = ex.Message;
    _logger.LogError(ex, "Form conversion failed {@OperationContext}", operationContext);
    return Result<string>.Failure(ex.Message);
}
finally
{
    stopwatch.Stop();
    operationContext["DurationMs"] = stopwatch.ElapsedMilliseconds;
}
```

### 2. High Cardinality & Dimensionality (CRITICAL)

Include fields with high cardinality (Session IDs, Lead IDs, Schema IDs - thousands/millions of unique values) and high dimensionality (many contextual fields per event). This enables instant filtering and answering unexpected questions.

### 3. Business Context (CRITICAL)

Always include business-meaningful context: Schema Name, Customer Type, Template Type, Clipboard Source, Hotkey Triggered. Understand the business impact, not just raw execution traces.

### 4. Multi-Sink Architecture & Environment Context (CRITICAL)

Log entries must carry application environment context (App Version, OS Version, .NET Runtime, Machine Name, Process ID).
Support 3 distinct log sinks:
1. **Console Real-time Sink** (Debug Console)
2. **Daily Rolling Log Sink** (`Logs/app-yyyyMMdd.log`)
3. **Session Debug Log Sink** (`Logs/Sessions/session-latest.log`)

### 5. Structured Templates & Single DI Logger (HIGH)

- Always use message templates with named parameters: `_logger.LogInformation("Converted {LeadName} with {SchemaId}", name, id);`
- **NEVER** use string interpolation `$"..."` or string concatenation inside log methods.
- Inject `ILogger<T>` through constructor injection.

### 6. Two Primary Log Levels in Core Flows (HIGH)

Simplify application logs primarily to:
- `Information`: Normal lifecycle events and wide operation completions.
- `Error`: Failures, unexpected exceptions, and degraded states.
- `Debug`: Deep diagnostics for development mode.

## Anti-Patterns to Avoid

1. ❌ **Scattered Logs**: Emitting 10 `_logger.LogDebug` lines in one method instead of a single wide event.
2. ❌ **String Interpolation**: Writing `_logger.LogInformation($"Customer {name}")` which destroys structured data querying.
3. ❌ **Swallowed Exceptions**: Logging `ex.Message` without passing the `Exception` object as the first parameter.
4. ❌ **Missing Business Context**: Logging "Operation failed" with no schema ID or payload size.
5. ❌ **Unstructured Strings**: Emitting freeform text that cannot be parsed by log analyzers.

## Guidelines

- **[rules/wide-events.md](rules/wide-events.md)** — Core pattern, lifecycle events, duration tracking.
- **[rules/context.md](rules/context.md)** — High cardinality, business context, and environment characteristics.
- **[rules/structure.md](rules/structure.md)** — Structured message templates, Serilog multi-sink, JSON formatting.
- **[rules/pitfalls.md](rules/pitfalls.md)** — Anti-patterns, cross-thread exceptions, and performance traps.

---

> References:
> - Serilog Documentation: https://serilog.net
> - Observability Wide Events: https://boristane.com/blog/observability-wide-events-101/
> - Stripe Canonical Log Lines: https://stripe.com/blog/canonical-log-lines
