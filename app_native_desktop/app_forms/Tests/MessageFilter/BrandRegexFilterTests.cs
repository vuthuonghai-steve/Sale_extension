using AppForms.Backend.Services.MessageFilter.SubFilters;
using AppForms.Shared.Models.MessageFilter;
using Xunit;

namespace AppForms.Tests.MessageFilter;

public class BrandRegexFilterTests
{
    private readonly BrandRegexFilter _filter = new();

    [Fact]
    public void Metadata_HasCorrectNameAndPriority()
    {
        Assert.Equal("Brand & Source Team Filter", _filter.Name);
        Assert.Equal(4, _filter.Priority);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void IsEnabled_ReflectsFilterOptions(bool enable)
    {
        var options = new FilterPipelineOptions { EnableBrandFilter = enable };
        Assert.Equal(enable, _filter.IsEnabled(options));
    }

    [Theory]
    [InlineData(null, null)]
    [InlineData("", "")]
    [InlineData("   ", "")]
    public void Process_HandlesNullEmptyAndWhitespace(string? input, string? expected)
    {
        string actual = _filter.Process(input!);
        Assert.Equal(expected, actual);
    }

    [Theory]
    [InlineData("• Nguồn hàng cập nhật liên tục tại 🏆TL21House🏆")]
    [InlineData("Nguồn hàng cập nhật liên tục tại 🏆 TL House 🏆")]
    [InlineData("🏆TL21House🏆")]
    [InlineData("TL21House")]
    [InlineData("TL 21 House")]
    [InlineData("⭐TL100House⭐")]
    [InlineData("- Nguồn hàng cập nhật liên tục tại\n                🏆TL21House🏆")]
    public void Process_RemovesBrandAndSourceTeamSignatures(string brandSignature)
    {
        string input = $"🏢 Địa chỉ: 18 Nguyễn Cơ Thạch\n{brandSignature}";
        string actual = _filter.Process(input);
        Assert.DoesNotContain("TL21House", actual);
        Assert.DoesNotContain("TL 21 House", actual);
        Assert.DoesNotContain("TL House", actual);
        Assert.DoesNotContain("TL100House", actual);
        Assert.Contains("🏢 Địa chỉ: 18 Nguyễn Cơ Thạch", actual);
    }

    [Theory]
    [InlineData("Nguồn hàng cập nhật liên tục tại:")]
    [InlineData("• Nguồn hàng cập nhật liên tục tại")]
    [InlineData("- Nguồn hàng cập nhật liên tục tại")]
    [InlineData("  Nguồn hàng cập nhật liên tục tại  ")]
    public void Process_CleansUpDanglingEmptySourceLines(string danglingLine)
    {
        string input = $"🏢 Địa chỉ: 18 Nguyễn Cơ Thạch\n{danglingLine}\n☘ Giá: 4tr5";
        string actual = _filter.Process(input);
        Assert.DoesNotContain("Nguồn hàng cập nhật liên tục tại", actual);
        Assert.Contains("🏢 Địa chỉ: 18 Nguyễn Cơ Thạch", actual);
        Assert.Contains("☘ Giá: 4tr5", actual);
    }

    [Fact]
    public void Process_PreservesLegitimateApartmentAndHouseDescriptions()
    {
        string input = "🏢 Nhà mặt phố Cầu Giấy (House view đẹp)\n☘ Phòng khép kín sạch sẽ";
        string actual = _filter.Process(input);
        Assert.Equal(input, actual);
    }
}
