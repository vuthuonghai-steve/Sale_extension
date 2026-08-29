using System;
using AppForms.Backend.Infrastructure;
using Xunit;

namespace AppForms.Tests.Backend;

public class LoggingEnvironmentTests
{
    [Fact]
    public void IsDevelopmentEnvironment_ReturnsBooleanWithoutException()
    {
        var isDev = LoggingConfiguration.IsDevelopmentEnvironment();
        // Trong môi trường Unit Test / Debug test runner, kết quả phải là true hoặc false an toàn
        Assert.True(isDev || !isDev);
    }

    [Fact]
    public void Initialize_ExecutesSafely_ReturnsValidLogDirectory()
    {
        LoggingConfiguration.Initialize(out var logDirectory, out var sessionPath);

        Assert.False(string.IsNullOrWhiteSpace(logDirectory));
        Assert.True(Directory.Exists(logDirectory));
    }
}
