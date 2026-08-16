---
title: Common Pitfalls & Anti-Patterns
impact: MEDIUM
tags: logging, anti-patterns, pitfalls, serilog, csharp
---

# Common Pitfalls & Anti-Patterns

**Impact: MEDIUM**

Avoid these anti-patterns that undermine logging effectiveness and system performance.

## Pitfall 1: Scattered Micro-Logs per Operation

Emitting multiple disconnected log lines for a single user action creates clutter without analytical value.

❌ **Incorrect (Scattered):**
```csharp
public async Task<string> ProcessAsync(string rawInput)
{
    _logger.LogInformation("Start process input");             // Line 1
    _logger.LogInformation("Length is {Length}", rawInput.Length); // Line 2
    var lead = _parser.Parse(rawInput);
    _logger.LogInformation("Parsed customer {Name}", lead.CustomerName); // Line 3
    var output = _engine.Render(lead);
    _logger.LogInformation("Render complete");                  // Line 4
    return output;
}
```

✅ **Correct (Consolidated Wide Event):**
```csharp
public async Task<string> ProcessAsync(string rawInput)
{
    var sw = Stopwatch.StartNew();
    var lead = _parser.Parse(rawInput);
    var output = _engine.Render(lead);
    sw.Stop();

    _logger.LogInformation("Lead converted successfully. Customer: {CustomerName}, InLen: {InputLength}, OutLen: {OutputLength}, ElapsedMs: {ElapsedMs}",
        lead.CustomerName, rawInput.Length, output.Length, sw.ElapsedMilliseconds);

    return output;
}
```

## Pitfall 2: String Interpolation instead of Message Templates

String interpolation renders strings eagerly in memory and destroys structured property indexing in sinks.

❌ **Incorrect:**
```csharp
_logger.LogInformation($"User {user.Name} changed schema to {schema.Id}");
```

✅ **Correct:**
```csharp
_logger.LogInformation("User {UserName} changed schema to {SchemaId}", user.Name, schema.Id);
```

## Pitfall 3: Swallowing Exceptions or Omitting Exception Parameter

When catching exceptions, always pass the `Exception` object as the FIRST argument to the logger.

❌ **Incorrect:**
```csharp
try { ... }
catch (Exception ex)
{
    _logger.LogError("Failed to save: " + ex.Message); // Stack trace lost!
}
```

✅ **Correct:**
```csharp
try { ... }
catch (Exception ex)
{
    _logger.LogError(ex, "Failed to save settings for User {UserId}", user.Id);
}
```

## Pitfall 4: Logging PII (Personally Identifiable Information) Unmasked in Plaintext

Be cautious with sensitive fields (passwords, complete credit cards, raw tokens). Mask or hash sensitive credentials before logging.

✅ **Correct:**
```csharp
_logger.LogInformation("User authenticated with token prefix: {TokenPrefix}***", token[..4]);
```
