using ClipboardFilterApp.Contracts;
using ClipboardFilterApp.Modules.CompositeModules;
using ClipboardFilterApp.Modules.SubModules;
using Xunit;

namespace Modules.Tests;

public class FilterOptionsToggleTests
{
    private static ClipboardPipelineManager CreatePipeline(FilterOptions options)
    {
        var filters = new List<IClipboardFilter>
        {
            new UnicodeSanitizerFilter(),
            new ReplyQuoteFilter(),
            new ZaloStickerFilter(),
            new BrandRegexFilter(),
            new CommissionRegexFilter(),
            new UrlSanitizerFilter()
        };

        return new ClipboardPipelineManager(options, filters);
    }

    [Fact]
    public void DefaultOptions_HaveAllTogglesEnabledAndCorrectPayloadLimit()
    {
        var options = new FilterOptions();

        Assert.True(options.EnableService);
        Assert.True(options.EnableUnicodeSanitizer);
        Assert.True(options.EnableReplyQuoteFilter);
        Assert.True(options.EnableZaloStickerFilter);
        Assert.True(options.EnableBrandFilter);
        Assert.True(options.EnableCommissionFilter);
        Assert.True(options.EnableUrlSanitizer);
        Assert.Equal(100_000, options.MaxPayloadCharacterLimit);
    }

    [Fact]
    public void Toggle_EnableUnicodeSanitizer_WhenDisabled_PreservesZeroWidthAndNonBreakingSpaces()
    {
        var options = new FilterOptions { EnableUnicodeSanitizer = false };
        var pipeline = CreatePipeline(options);

        string input = "Mã:\u200b 🏆 032";
        string actual = pipeline.Process(input);

        Assert.Contains("\u200b", actual);
    }

    [Fact]
    public void Toggle_EnableReplyQuoteFilter_WhenDisabled_PreservesZaloReplyQuoteHeader()
    {
        var options = new FilterOptions { EnableReplyQuoteFilter = false, EnableCommissionFilter = false };
        var pipeline = CreatePipeline(options);

        string input = "Nguyễn Văn A\n[10:30] 🌷 40% Mã: 🏆 032\n🏢 Địa chỉ: 15 Quan Hoa";
        string actual = pipeline.Process(input);

        Assert.Contains("Nguyễn Văn A", actual);
    }

    [Fact]
    public void Toggle_EnableZaloStickerFilter_WhenDisabled_PreservesZaloStickersAndTags()
    {
        var options = new FilterOptions { EnableZaloStickerFilter = false };
        var pipeline = CreatePipeline(options);

        string input = "/-smile Chúc bạn ngày mới tốt lành\n[Hình ảnh]\n🏢 Địa chỉ: 88 Trần Duy Hưng";
        string actual = pipeline.Process(input);

        Assert.Contains("/-smile", actual);
        Assert.Contains("[Hình ảnh]", actual);
    }

    [Fact]
    public void Toggle_EnableBrandFilter_WhenDisabled_PreservesBrandSignatures()
    {
        var options = new FilterOptions { EnableBrandFilter = false };
        var pipeline = CreatePipeline(options);

        string input = "🏢 Địa chỉ: 18 Nguyễn Cơ Thạch\n• Nguồn hàng cập nhật liên tục tại 🏆TL21House🏆";
        string actual = pipeline.Process(input);

        Assert.Contains("TL21House", actual);
    }

    [Fact]
    public void Toggle_EnableCommissionFilter_WhenDisabled_PreservesCommissionInfo()
    {
        var options = new FilterOptions { EnableCommissionFilter = false };
        var pipeline = CreatePipeline(options);

        string input = "🌷 40%-12m 🏆 032\n🏢 Địa chỉ: Số 15 ngõ 42 Yên Hoà";
        string actual = pipeline.Process(input);

        Assert.Contains("40%-12m", actual);
    }

    [Fact]
    public void Toggle_EnableUrlSanitizer_WhenDisabled_PreservesUrlTrackingParams()
    {
        var options = new FilterOptions { EnableUrlSanitizer = false };
        var pipeline = CreatePipeline(options);

        string input = "https://example.com/?utm_source=facebook&fbclid=123";
        string actual = pipeline.Process(input);

        Assert.Contains("utm_source=facebook", actual);
    }

    [Fact]
    public void Toggle_MaxPayloadCharacterLimit_WhenExceeded_BypassesFilteringAndReturnsRawText()
    {
        var options = new FilterOptions { MaxPayloadCharacterLimit = 50 };
        var pipeline = CreatePipeline(options);

        string longPayload = "🌷 40%-12m 🏆 032\n🏢 Địa chỉ: Số 15 ngõ 42 Yên Hoà Cầu Giấy Hà Nội Việt Nam";
        Assert.True(longPayload.Length > options.MaxPayloadCharacterLimit);

        string actual = pipeline.Process(longPayload);
        // Trả về chuỗi nguyên gốc không lọc khi vượt ngưỡng Payload
        Assert.Equal(longPayload, actual);
    }

    [Theory]
    [InlineData(null, null)]
    [InlineData("", "")]
    [InlineData("   ", "")]
    public void EdgeCase_NullEmptyAndWhitespace_HandledSafely(string? input, string? expected)
    {
        var options = new FilterOptions();
        var pipeline = CreatePipeline(options);

        string actual = pipeline.Process(input!);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void EdgeCase_UnicodeAndSurrogatePairs_PreservedAcrossEntirePipeline()
    {
        var options = new FilterOptions();
        var pipeline = CreatePipeline(options);

        string input = "🌷 40%-12m Mã: 🏆 101 🌸 🌺 🌻 🌹 💐 🍾 ⭐ 📍\n🏢 Địa chỉ: 52 Mỹ Đình\n☘ Giá: 4tr5";
        string actual = pipeline.Process(input);

        Assert.Contains("🏆 101", actual);
        Assert.Contains("🌸 🌺 🌻 🌹 💐 🍾 ⭐ 📍", actual);
        Assert.Contains("🏢 Địa chỉ: 52 Mỹ Đình", actual);
        Assert.Contains("☘ Giá: 4tr5", actual);
    }

    [Fact]
    public void EdgeCase_SpecialCharactersAndComplexWhitespace_CleanedAndNormalized()
    {
        var options = new FilterOptions();
        var pipeline = CreatePipeline(options);

        string input = "🌷 40%-12m    Mã: 🏆 379\r\n\r\n\r\n\r\n🏢 Địa chỉ:\t\t52 Mỹ Đình\n\n\n\n☘ Giá: 4tr5";
        string expected = "Mã: 🏆 379\n\n🏢 Địa chỉ: 52 Mỹ Đình\n\n☘ Giá: 4tr5";

        string actual = pipeline.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void EdgeCase_ChainedFormatting_AllFiltersCooperateProperly()
    {
        var options = new FilterOptions();
        var pipeline = CreatePipeline(options);

        string input = "Nguyễn Văn A\n[10:30] 🌷 Tin nhắn cũ\n" +
                       "🌷 40%-12m\xa0Mã:\u200b 🏆 032\n" +
                       "/-rose 35% Mã 801\n" +
                       "[Hình ảnh]\n" +
                       "🏢 Địa chỉ: Số 15 ngõ 42 Yên Hoà\n" +
                       "---------------------\n" +
                       "☘ Giá: 6tr2 - p601\n" +
                       "• Nguồn hàng cập nhật liên tục tại 🏆TL21House🏆";

        string actual = pipeline.Process(input);

        Assert.DoesNotContain("Nguyễn Văn A", actual);
        Assert.DoesNotContain("40%-12m", actual);
        Assert.DoesNotContain("/-rose", actual);
        Assert.DoesNotContain("[Hình ảnh]", actual);
        Assert.DoesNotContain("---------------------", actual);
        Assert.DoesNotContain("TL21House", actual);
        Assert.DoesNotContain("\xa0", actual, StringComparison.Ordinal);
        Assert.DoesNotContain("\u200b", actual, StringComparison.Ordinal);
        Assert.Contains("🏢 Địa chỉ: Số 15 ngõ 42 Yên Hoà", actual);
        Assert.Contains("☘ Giá: 6tr2 - p601", actual);
    }
}
