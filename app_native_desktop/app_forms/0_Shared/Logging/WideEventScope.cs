using System;
using System.Collections.Generic;
using System.Diagnostics;
using Microsoft.Extensions.Logging;

namespace AppForms.Shared.Logging;

/// <summary>
/// Quản lý phát sinh Canonical Log Lines / Wide Events giàu ngữ cảnh và thông số hiệu năng.
/// </summary>
public sealed class WideEventScope : IDisposable
{
    private readonly ILogger _logger;
    private readonly string _operationName;
    private readonly Stopwatch _stopwatch;
    private readonly Dictionary<string, object?> _context;
    private bool _isCompleted;

    public WideEventScope(ILogger logger, string operationName)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _operationName = operationName;
        _stopwatch = Stopwatch.StartNew();
        _context = new Dictionary<string, object?>
        {
            ["Operation"] = operationName,
            ["SessionId"] = Guid.NewGuid().ToString("N"),
            ["Timestamp"] = DateTimeOffset.UtcNow,
            ["Status"] = "InProgress"
        };
    }

    public WideEventScope Set(string key, object? value)
    {
        _context[key] = value;
        return this;
    }

    public void Complete(string status = "Success")
    {
        if (_isCompleted) return;
        _isCompleted = true;

        _stopwatch.Stop();
        _context["Status"] = status;
        _context["DurationMs"] = _stopwatch.ElapsedMilliseconds;

        _logger.LogInformation("Tác vụ {Operation} hoàn tất với trạng thái {Status} trong {DurationMs}ms {@OperationContext}",
            _operationName, status, _stopwatch.ElapsedMilliseconds, _context);
    }

    public void Fail(Exception ex, string? customMessage = null)
    {
        if (_isCompleted) return;
        _isCompleted = true;

        _stopwatch.Stop();
        _context["Status"] = "Failed";
        _context["DurationMs"] = _stopwatch.ElapsedMilliseconds;
        _context["ErrorType"] = ex.GetType().Name;
        _context["ErrorMessage"] = ex.Message;

        _logger.LogError(ex, "Tác vụ {Operation} thất bại sau {DurationMs}ms: {Message} {@OperationContext}",
            _operationName, _stopwatch.ElapsedMilliseconds, customMessage ?? ex.Message, _context);
    }

    public void Dispose()
    {
        if (!_isCompleted)
        {
            Complete();
        }
    }
}
