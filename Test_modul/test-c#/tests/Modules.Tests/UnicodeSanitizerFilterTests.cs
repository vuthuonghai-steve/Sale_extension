using System.Text;
using ClipboardFilterApp.Contracts;
using ClipboardFilterApp.Modules.SubModules;
using Xunit;

namespace Modules.Tests;

public class UnicodeSanitizerFilterTests
{
    private readonly UnicodeSanitizerFilter _filter = new();

    [Fact]
    public void Metadata_HasCorrectNameAndPriority()
    {
        Assert.Equal("Unicode Sanitizer Filter", _filter.Name);
        Assert.Equal(1, _filter.Priority);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void IsEnabled_ReflectsFilterOptions(bool enable)
    {
        var options = new FilterOptions { EnableUnicodeSanitizer = enable };
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
    public void Process_ReplacesNonBreakingSpaceWithStandardSpace()
    {
        string input = "Phòng\xa0trọ\xa0giá\xa0rẻ";
        string expected = "Phòng trọ giá rẻ";

        string actual = _filter.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void Process_StripsHiddenZeroWidthAndBomCharacters()
    {
        // \u200B (Zero-width space), \uFEFF (BOM), \uFFFD (Replacement char)
        string input = "Mã:\u200b \ufeff🏆\ufffd 032";
        string expected = "Mã: 🏆 032";

        string actual = _filter.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void Process_NormalizesUnicodeFormDToFormC()
    {
        // NFD decomposed: 'T', 'i', \u0301 (combining acute accent), 'n', 'h'
        string nfd = "Ti\u0301nh Câ\u0300u Giâ\u0301y";
        string expectedNfc = "Tính Cầu Giấy";

        string actual = _filter.Process(nfd);
        Assert.Equal(expectedNfc, actual);
        Assert.True(actual.IsNormalized(NormalizationForm.FormC));
    }

    [Fact]
    public void Process_PreservesSurrogatePairsAndEmojis()
    {
        string input = "🏢 Địa chỉ 🏆 032 🌷 ☘ ⌛️ 🌹 💐 🍾 ⭐ 📍";
        string actual = _filter.Process(input);
        Assert.Equal(input, actual);
    }

    [Fact]
    public void Process_HandlesHugePayloadWithHiddenCharacters()
    {
        var sb = new StringBuilder();
        for (int i = 0; i < 1000; i++)
        {
            sb.Append($"Line {i}\xa0with\u200b hidden\ufeff characters\n");
        }
        string input = sb.ToString();

        string actual = _filter.Process(input);
        Assert.DoesNotContain("\xa0", actual, StringComparison.Ordinal);
        Assert.DoesNotContain("\u200b", actual, StringComparison.Ordinal);
        Assert.DoesNotContain("\ufeff", actual, StringComparison.Ordinal);
    }
}
