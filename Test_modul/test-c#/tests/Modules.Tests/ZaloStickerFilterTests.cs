using ClipboardFilterApp.Contracts;
using ClipboardFilterApp.Modules.SubModules;
using Xunit;

namespace Modules.Tests;

public class ZaloStickerFilterTests
{
    private readonly ZaloStickerFilter _filter = new();

    [Fact]
    public void Metadata_HasCorrectNameAndPriority()
    {
        Assert.Equal("Zalo Sticker & System Tag Filter", _filter.Name);
        Assert.Equal(3, _filter.Priority);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void IsEnabled_ReflectsFilterOptions(bool enable)
    {
        var options = new FilterOptions { EnableZaloStickerFilter = enable };
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

    [Theory]
    [InlineData("/-rose 35% Mã 801", " 35% Mã 801")]
    [InlineData("/-heart Yêu thích", " Yêu thích")]
    [InlineData("/-strong Mạnh mẽ", " Mạnh mẽ")]
    [InlineData("/-thanks Cảm ơn", " Cảm ơn")]
    [InlineData("/-smile Cười", " Cười")]
    [InlineData("/-beer Dzô", " Dzô")]
    [InlineData("/-like Thích", " Thích")]
    [InlineData("/-pointright Xem tại đây", " Xem tại đây")]
    public void Process_StripsZaloTextStickers(string input, string expected)
    {
        string actual = _filter.Process(input);
        Assert.Equal(expected, actual);
    }

    [Theory]
    [InlineData("[Hình ảnh]")]
    [InlineData("[Sticker]")]
    [InlineData("[File]")]
    [InlineData("[Video]")]
    [InlineData("[Thẻ danh thiếp]")]
    [InlineData("[Vị trí]")]
    [InlineData("  [Hình ảnh]  ")]
    public void Process_StripsZaloSystemTagsOnStandaloneLines(string systemTagLine)
    {
        string input = $"{systemTagLine}\n🏢 Địa chỉ: 15 Quan Hoa";
        string actual = _filter.Process(input);
        Assert.DoesNotContain(systemTagLine.Trim(), actual);
        Assert.Contains("🏢 Địa chỉ: 15 Quan Hoa", actual);
    }

    [Theory]
    [InlineData("---------------------")]
    [InlineData("=====================")]
    [InlineData("*********************")]
    [InlineData("~~~~~~~~~~~~~~~~~~~~~")]
    [InlineData("•••••••••••••••••••••")]
    [InlineData("🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸")]
    [InlineData("🏆🏆🏆🏆🏆🏆🏆🏆🏆🏆")]
    [InlineData("⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐")]
    public void Process_StripsDecorativeLineSeparators(string separatorLine)
    {
        string input = $"🏢 Địa chỉ: 15 Quan Hoa\n{separatorLine}\n☘ Giá: 5tr";
        string actual = _filter.Process(input);
        Assert.DoesNotContain(separatorLine, actual);
        Assert.Contains("🏢 Địa chỉ: 15 Quan Hoa", actual);
        Assert.Contains("☘ Giá: 5tr", actual);
    }

    [Fact]
    public void Process_PreservesValidContentWithHyphensAndEmojis()
    {
        string input = "☘ Giá: 4tr5 - p201\n🏆 Nội thất: Đầy đủ - 2 phòng ngủ";
        string actual = _filter.Process(input);
        Assert.Equal(input, actual);
    }
}
