using ClipboardFilterApp.Contracts;
using ClipboardFilterApp.Modules.SubModules;
using Xunit;

namespace Modules.Tests;

public class ReplyQuoteFilterTests
{
    private readonly ReplyQuoteFilter _filter = new();

    [Fact]
    public void Metadata_HasCorrectNameAndPriority()
    {
        Assert.Equal("Zalo Reply Quote Stripper", _filter.Name);
        Assert.Equal(2, _filter.Priority);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void IsEnabled_ReflectsFilterOptions(bool enable)
    {
        var options = new FilterOptions { EnableReplyQuoteFilter = enable };
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
    public void Process_RemovesZaloReplyQuoteHeader()
    {
        string input = "Nguyễn Văn A\n[10:30] 🌷 40% Mã: 🏆 032\n🏢 Địa chỉ: Số 15 ngõ 42 Yên Hoà\nQuận: Cầu Giấy";

        // Filter alone removes the header lines before actual content
        string actual = _filter.Process(input);
        Assert.DoesNotContain("Nguyễn Văn A", actual);
    }

    [Fact]
    public void Process_PreservesNormalMessageWithoutQuote()
    {
        string input = "🏢 Địa chỉ: Số 15 ngõ 42 Yên Hoà\nQuận: Cầu Giấy\n☘ Giá: 6tr2";
        string actual = _filter.Process(input);
        Assert.Equal(input, actual);
    }

    [Fact]
    public void Process_HandlesMultiLineReplyQuoteHeader()
    {
        string input = "Trần Thị B\n[Hôm qua 15:20] 🌷 Tin nhắn gốc\n🌷 Hoa hồng 35%\n🏢 Địa chỉ: 88 Cầu Giấy";
        string actual = _filter.Process(input);
        Assert.DoesNotContain("Trần Thị B", actual);
        Assert.Contains("🏢 Địa chỉ: 88 Cầu Giấy", actual);
    }

    [Fact]
    public void Process_HandlesSpecialCharactersInSenderName()
    {
        string input = "Nguyễn Văn A_99\n[12:00] Mã: 🏆 101\n🏢 Địa chỉ: 12 Chùa Láng";
        string actual = _filter.Process(input);
        Assert.DoesNotContain("Nguyễn Văn A_99", actual);
        Assert.Contains("🏢 Địa chỉ: 12 Chùa Láng", actual);
    }
}
