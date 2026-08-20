using AppForms.Backend.Services.MessageFilter.SubFilters;
using AppForms.Shared.Models.MessageFilter;
using Xunit;

namespace AppForms.Tests.MessageFilter;

public class CommissionRegexFilterTests
{
    private readonly CommissionRegexFilter _filter = new();

    [Fact]
    public void Metadata_HasCorrectNameAndPriority()
    {
        Assert.Equal("Commission & Bonus Policy Filter", _filter.Name);
        Assert.Equal(5, _filter.Priority);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void IsEnabled_ReflectsFilterOptions(bool enable)
    {
        var options = new FilterPipelineOptions { EnableCommissionFilter = enable };
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
    [InlineData("🌷 40%-12m 🏆 032", "🏆 032")]
    [InlineData("🌷30% 6-12m Mã: 🏆 918", "Mã: 🏆 918")]
    [InlineData("🌷 40%- 12th | 30%- 6th Mã: 🏆 379", "Mã: 🏆 379")]
    [InlineData("🌷40% - 12m ( Chủ dẫn 30% -12M) Mã: 🏆 232", "Mã: 🏆 232")]
    [InlineData("🌷1tr1 - 6-12m Mã: 🏆 626", "Mã: 🏆 626")]
    [InlineData("🌷35%-hd 31/8/2027 Mã: 🏆 119", "Mã: 🏆 119")]
    [InlineData("🌷40% - hd toi 30/8/2027 Mã: 🏆 982", "Mã: 🏆 982")]
    [InlineData("🌷20%- 12m Mã: 🏆 366", "Mã: 🏆 366")]
    [InlineData("🌷40%_12th ( ctv dẫn)       30%_12th  ( Chủ dẫn)     Mã: 🏆", "Mã: 🏆")]
    [InlineData("🌷40%_12th ( ctv dẫn) Mã: 🏆", "Mã: 🏆")]
    [InlineData("🌷30%- 12m + thưởng sale 500k Mã: 🏆011", "Mã: 🏆011")]
    public void Process_StripsInlineCommissionBeforeCodeOrTrophy(string input, string expected)
    {
        string actual = _filter.Process(input);
        Assert.Equal(expected, actual);
    }

    [Theory]
    [InlineData("🌷 Mã: 🏆 063", "Mã: 🏆 063")]
    [InlineData("🌷 🏆 063", "🏆 063")]
    [InlineData("🌹 Mã: 123", "Mã: 123")]
    [InlineData("🌸 🏆 999", "🏆 999")]
    public void Process_StripsOrphanRoseEmojiBeforeCodeOrTrophy(string input, string expected)
    {
        string actual = _filter.Process(input);
        Assert.Equal(expected, actual);
    }

    [Theory]
    [InlineData("🌷40% - 6-12m")]
    [InlineData("30%-6th")]
    [InlineData("🌹 30-40 HĐ 6-12T")]
    [InlineData("🌹30%")]
    [InlineData("🌹30 HĐ 12T")]
    [InlineData("🌹40 + thưởng 500k AD 20/8")]
    [InlineData("(Chốt đúng giá, fix giá hh 30%)")]
    [InlineData("🌷40%_12th ( ctv dẫn)")]
    public void Process_StripsStandalonePercentageCommissionLines(string standaloneLine)
    {
        string input = $"{standaloneLine}\n🏢 Địa chỉ: 15 Trung Kính\nQuận: Cầu Giấy";
        string actual = _filter.Process(input);
        Assert.DoesNotContain(standaloneLine, actual);
        Assert.Contains("🏢 Địa chỉ: 15 Trung Kính", actual);
    }

    [Theory]
    [InlineData("THƯỞNG SALE 500K/PHÒNG NẾU KHÁCH CHỐT ĐÚNG GIÁ VÀ CHUYỂN VÀO TRƯỚC 15/8")]
    [InlineData("GIỮ PHÒNG ĐẾN HẾT THÁNG 8 NẾU KHÁCH CHỐT ĐÚNG GIÁ. CÓ FIX GIÁ CHO KHÁCH CHUYỂN VÀO Ở LUÔN HOẶC THƯỞNG SALE 500K/PHÒNG NẾU KHÁCH CHỐT ĐÚNG GIÁ VÀ CHUYỂN VÀO TRƯỚC 15/8")]
    [InlineData("Thưởng nóng 500k cho ctv chốt trong tuần")]
    [InlineData("Bonus sale 1tr chốt trước ngày 15")]
    public void Process_StripsBonusPolicyLines(string bonusLine)
    {
        string input = $"{bonusLine}\n🏢 Địa chỉ: 11D Thanh Nhàn\n☘ Giá: 4tr3";
        string actual = _filter.Process(input);
        Assert.DoesNotContain(bonusLine, actual);
        Assert.Contains("🏢 Địa chỉ: 11D Thanh Nhàn", actual);
    }

    [Fact]
    public void Process_PreservesProtectedLinesWithPriceAndAddress()
    {
        string input = "🏢 Địa chỉ: Số 15 ngõ 42 Yên Hoà\n☘ Giá: 6tr2 - p601\n⌛️ Trống: 1/9\n🏆 Nội thất: Đầy đủ";
        string actual = _filter.Process(input);
        Assert.Equal(input, actual);
    }
}
