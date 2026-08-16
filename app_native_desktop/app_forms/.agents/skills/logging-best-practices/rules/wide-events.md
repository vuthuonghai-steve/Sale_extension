---
title: Wide Events / Canonical Log Lines
impact: CRITICAL
tags: logging, wide-events, canonical-log-lines, serilog, csharp
---

# Wide Events / Canonical Log Lines

**Impact: CRITICAL**

Wide events (also called canonical log lines) are the foundation of modern, observable logging. For each significant operation or request, emit **a single, context-rich structured event**.

Instead of scattering 10-20 separate log lines throughout your methods, consolidate all key execution indicators and emit once in a `finally` block or on operation completion.

## The C# / .NET Pattern

Build the event dictionary or object throughout the operation lifecycle, then emit once in a `finally` block to guarantee recording regardless of success or exception.

```csharp
public async Task<Result<LeadConversionResult>> ConvertAsync(string rawClipboardText)
{
    var startTime = Stopwatch.GetTimestamp();
    var wideEvent = new Dictionary<string, object?>
    {
        ["Operation"] = "LeadConversion",
        ["SessionId"] = AppSession.CurrentId,
        ["InputLength"] = rawClipboardText?.Length ?? 0,
        ["TimestampUtc"] = DateTimeOffset.UtcNow
    };

    try
    {
        var schema = await _schemaDetector.DetectAsync(rawClipboardText);
        wideEvent["SchemaId"] = schema.Id;
        wideEvent["SchemaType"] = schema.Category;

        var lead = _parser.Parse(rawClipboardText, schema);
        wideEvent["CustomerName"] = lead.CustomerName;
        wideEvent["RoomCodeFound"] = !string.IsNullOrEmpty(lead.RoomCode);

        var output = _templateEngine.Render(lead, schema);
        wideEvent["OutputLength"] = output.Length;
        wideEvent["Status"] = "Success";

        var result = new LeadConversionResult(lead, schema, output);
        return Result<LeadConversionResult>.Success(result);
    }
    catch (Exception ex)
    {
        wideEvent["Status"] = "Error";
        wideEvent["ErrorType"] = ex.GetType().FullName;
        wideEvent["ErrorMessage"] = ex.Message;
        _logger.LogError(ex, "Lead conversion failed {@WideEvent}", wideEvent);
        return Result<LeadConversionResult>.Failure(ex.Message);
    }
    finally
    {
        var elapsedMs = Stopwatch.GetElapsedTime(startTime).TotalMilliseconds;
        wideEvent["DurationMs"] = elapsedMs;

        if (wideEvent["Status"] as string == "Success")
        {
            _logger.LogInformation("Lead conversion completed {@WideEvent}", wideEvent);
        }
    }
}
```

## Benefits of Wide Events

1. **Zero Log Interleaving**: In multi-threaded environments, separate log lines from different threads interleave and become impossible to read. A wide event is atomic.
2. **Instant Performance Metric**: Every wide event naturally tracks its own duration in milliseconds.
3. **Query Flexibility**: You can filter by any property: `DurationMs > 500 AND SchemaId = 'ZaloCOD'`.
