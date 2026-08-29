using AppForms.Backend.Adapters.Win32;
using Xunit;

namespace AppForms.Tests.Backend;

public class WindowsSystemLauncherAdapterTests
{
    private readonly WindowsSystemLauncherAdapter _launcher;

    public WindowsSystemLauncherAdapterTests()
    {
        _launcher = new WindowsSystemLauncherAdapter();
    }

    [Theory]
    [InlineData("javascript:alert(1)", false)]
    [InlineData("file:///C:/Windows/System32/calc.exe", false)]
    [InlineData("ftp://example.com/file", false)]
    [InlineData("invalid-url-string", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void OpenBrowser_InvalidOrDangerousUrl_ReturnsFalse(string? url, bool expected)
    {
        var result = _launcher.OpenBrowser(url!);
        Assert.Equal(expected, result);
    }

    [Fact]
    public void GetExecutablePath_ReturnsNonEmptyValidPath()
    {
        var path = _launcher.GetExecutablePath();
        Assert.False(string.IsNullOrWhiteSpace(path));
    }
}
