using AppForms.Backend.Services.MessageFilter.Helpers;
using AppForms.Backend.Services.MessageFilter.SubFilters;
using AppForms.Shared.Models.MessageFilter;
using Xunit;

namespace AppForms.Tests.MessageFilter;

public class PriceNormalizerFilterTests
{
    private readonly PriceNormalizerFilter _filter = new();
    private readonly FilterPipelineOptions _options = new();

    [Theory]
    // 1. Dạng triệu có phân cách chấm/phẩy hoặc số liền
    [InlineData("4.000.000", "4tr")]
    [InlineData("4,000,000", "4tr")]
    [InlineData("4000000", "4tr")]
    [InlineData("4.600.000", "4tr6")]
    [InlineData("4,600,000", "4tr6")]
    [InlineData("4600000", "4tr6")]
    [InlineData("4.650.000", "4tr65")]
    [InlineData("4,650,000", "4tr65")]
    [InlineData("4650000", "4tr65")]
    [InlineData("4.050.000", "4tr05")]
    [InlineData("12.000.000", "12tr")]
    [InlineData("12.500.000", "12tr5")]
    [InlineData("12500000", "12tr5")]
    [InlineData("3.800.000đ", "3tr8")]
    [InlineData("3.800.000 vnd", "3tr8")]
    [InlineData("3.800.000 VND", "3tr8")]
    // 2. Dạng thập phân có đơn vị tr / triệu
    [InlineData("4.6 tr", "4tr6")]
    [InlineData("4.6tr", "4tr6")]
    [InlineData("4,6 tr", "4tr6")]
    [InlineData("4,6tr", "4tr6")]
    [InlineData("4.6 triệu", "4tr6")]
    [InlineData("4.6triệu", "4tr6")]
    [InlineData("4.0 tr", "4tr")]
    [InlineData("4.0tr", "4tr")]
    [InlineData("4 tr", "4tr")]
    [InlineData("4tr", "4tr")]
    [InlineData("4 triệu", "4tr")]
    [InlineData("4.65 tr", "4tr65")]
    [InlineData("4.05 tr", "4tr05")]
    [InlineData("12.5 tr", "12tr5")]
    // 3. Dạng hàng nghìn k >= 1000k
    [InlineData("4000k", "4tr")]
    [InlineData("4.000k", "4tr")]
    [InlineData("4,000k", "4tr")]
    [InlineData("4600k", "4tr6")]
    [InlineData("4.600k", "4tr6")]
    [InlineData("4650k", "4tr65")]
    [InlineData("4050k", "4tr05")]
    // 4. Dạng đã rút gọn còn số 0 thừa
    [InlineData("4tr000", "4tr")]
    [InlineData("4tr600", "4tr6")]
    [InlineData("4tr50", "4tr5")]
    public void Should_Normalize_Individual_Price_Formats(string input, string expected)
    {
        string actual = _filter.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void Should_Normalize_Prices_In_Full_Message()
    {
        string input = "☘ Giá: 4.600.000 - p201\n       4.000.000 - p302\n       4.6 tr - p401\n       4600k - p501\n       12.500.000/tháng";
        string expected = "☘ Giá: 4tr6 - p201\n       4tr - p302\n       4tr6 - p401\n       4tr6 - p501\n       12tr5/tháng";

        string actual = _filter.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void Should_Protect_PhoneNumbers_Dates_And_Dimensions()
    {
        string input = "📞 SĐT: 0984.123.456 hoặc 0912345678\n⌛️ Trống: 30/8/2027\n📐 Diện tích: 30m2\n🏢 Địa chỉ: Số 15 ngõ 42 Yên Hoà\n☘ Giá: 4.600.000";
        string expected = "📞 SĐT: 0984.123.456 hoặc 0912345678\n⌛️ Trống: 30/8/2027\n📐 Diện tích: 30m2\n🏢 Địa chỉ: Số 15 ngõ 42 Yên Hoà\n☘ Giá: 4tr6";

        string actual = _filter.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void Should_Format_Decimal_Millions_Correctly()
    {
        Assert.Equal("4tr", PriceNormalizerUtil.FormatDecimalMillions(4.0m));
        Assert.Equal("4tr6", PriceNormalizerUtil.FormatDecimalMillions(4.6m));
        Assert.Equal("4tr65", PriceNormalizerUtil.FormatDecimalMillions(4.65m));
        Assert.Equal("4tr05", PriceNormalizerUtil.FormatDecimalMillions(4.05m));
        Assert.Equal("12tr", PriceNormalizerUtil.FormatDecimalMillions(12.0m));
        Assert.Equal("12tr5", PriceNormalizerUtil.FormatDecimalMillions(12.5m));
    }
}
