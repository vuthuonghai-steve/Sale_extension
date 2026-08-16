---
title: Structure, Format, and Multi-Sink Architecture
impact: HIGH
tags: logging, serilog, structure, multi-sink, json, dependency-injection
---

# Structure, Format, and Multi-Sink Architecture

**Impact: HIGH**

Structured logging transforms logs from unparseable text files into indexed, queryable data streams.

## Multi-Sink Serilog Architecture in AppForms

Configure Serilog at startup in `Program.cs` to dispatch to 3 complementary sinks:

```csharp
public static class LoggingBootstrapper
{
    public static void InitializeLogging()
    {
        var logsDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Logs");
        var sessionsDir = Path.Combine(logsDir, "Sessions");
        Directory.CreateDirectory(sessionsDir);

        // Archive previous session log if exists
        ArchivePreviousSession(sessionsDir);

        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Debug()
            .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
            .MinimumLevel.Override("System", LogEventLevel.Warning)
            .Enrich.FromLogContext()
            .Enrich.WithProperty("AppVersion", AppConstants.Version)
            // Sink 1: Real-time Debug Console
            .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}")
            // Sink 2: Daily Rolling File (31-day retention)
            .WriteTo.File(
                Path.Combine(logsDir, "app-.log"),
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 31,
                fileSizeLimitBytes: 10 * 1024 * 1024,
                rollOnFileSizeLimit: true,
                outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} {Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}")
            // Sink 3: Latest Session Log
            .WriteTo.File(
                Path.Combine(sessionsDir, "session-latest.log"),
                outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} {Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}")
            .CreateLogger();
    }
}
```

## Consistent Dependency Injection Usage

Every class requiring logging must receive `ILogger<T>` through its constructor:

```csharp
namespace AppForms.Backend.Services;

public class FormConverterService : IFormConverterService
{
    private readonly ILogger<FormConverterService> _logger;
    private readonly IMessageParserService _parser;

    public FormConverterService(
        ILogger<FormConverterService> logger,
        IMessageParserService parser)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _parser = parser ?? throw new ArgumentNullException(nameof(parser));
    }
}
```

## JSON Object Destructuring with `@`

When logging complex domain entities or state payloads in Serilog, prefix the parameter with `@` to serialize it as a structured JSON object rather than calling `.ToString()`:

```csharp
// @ operator tells Serilog to destructure the object into JSON properties
_logger.LogInformation("Saved room code mappings: {@RoomCodes}", roomCodes);
```
