using ClipboardFilterApp.Contracts;
using ClipboardFilterApp.Modules.SubModules;
using Xunit;

namespace Modules.Tests;

public class UrlSanitizerFilterTests
{
    private readonly UrlSanitizerFilter _filter = new();

    [Fact]
    public void Metadata_HasCorrectNameAndPriority()
    {
        Assert.Equal("URL Tracking Sanitizer Filter", _filter.Name);
        Assert.Equal(6, _filter.Priority);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void IsEnabled_ReflectsFilterOptions(bool enable)
    {
        var options = new FilterOptions { EnableUrlSanitizer = enable };
        Assert.Equal(enable, _filter.IsEnabled(options));
    }

    [Theory]
    [InlineData(null, null)]
    [InlineData("", "")]
    [InlineData("   ", "   ")]
    public void Process_HandlesNullEmptyAndWhitespace(string? input, string? expected)
    {
        string actual = _filter.Process(input!);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void Process_IgnoresNonUrlText()
    {
        string input = "Thông tin phòng trọ: utm_source=fb fbclid=123456";
        string actual = _filter.Process(input);
        Assert.Equal(input, actual);
    }

    [Theory]
    [InlineData("https://example.com/?utm_source=facebook", "https://example.com/")]
    [InlineData("https://example.com?fbclid=IwAR0123456789", "https://example.com")]
    [InlineData("http://example.com/item?gclid=xyz123", "http://example.com/item")]
    [InlineData("https://example.com/post?ref=share_btn", "https://example.com/post")]
    [InlineData("https://example.com/search?q=phongtro&utm_source=google&utm_medium=cpc", "https://example.com/search?q=phongtro")]
    public void Process_StripsTrackingParametersFromUrl(string input, string expected)
    {
        string actual = _filter.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void Process_PreservesCleanUrlWithoutTracking()
    {
        string input = "https://example.com/rooms/101?floor=3&price=5000000";
        string actual = _filter.Process(input);
        Assert.Equal(input, actual);
    }
}
