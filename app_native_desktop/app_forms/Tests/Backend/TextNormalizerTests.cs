using AppForms.Backend.Utils;
using Xunit;

namespace AppForms.Tests.Backend;

public class TextNormalizerTests
{
    [Theory]
    [InlineData("Tiếng Việt Có Dấu", "Tieng Viet Co Dau")]
    [InlineData("Đồng Nai Đắk Lắk", "Dong Nai Dak Lak")]
    [InlineData("đường Lê Duẩn, Đà Nẵng", "duong Le Duan, Da Nang")]
    [InlineData("", "")]
    [InlineData(null, "")]
    public void RemoveAccents_RemovesVietnameseDiacriticsCorrectly(string? input, string expected)
    {
        var result = TextNormalizer.RemoveAccents(input);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("Mã Phòng: ", "maphong")]
    [InlineData("Tên KH (FB/Zalo)", "tenkhfbzalo")]
    [InlineData("Số Điện Thoại:", "sodienthoai")]
    [InlineData("  Giá Thuê (Triệu)  ", "giathuetrieu")]
    [InlineData("", "")]
    [InlineData(null, "")]
    public void NormalizeKey_ConvertsToCleanAlphanumericKey(string? input, string expected)
    {
        var result = TextNormalizer.NormalizeKey(input);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData(" MN 35 ", "MN35")]
    [InlineData("C - 101", "C-101")]
    [InlineData("  TS  007  ", "TS007")]
    [InlineData("", "")]
    [InlineData(null, "")]
    public void CleanCode_RemovesInternalAndSurroundingWhitespaces(string? input, string expected)
    {
        var result = TextNormalizer.CleanCode(input);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("  Hà   Nội    Việt Nam  ", "Hà Nội Việt Nam")]
    [InlineData("SingleWord", "SingleWord")]
    [InlineData("", "")]
    [InlineData(null, "")]
    public void CollapseWhitespace_ReducesMultipleSpacesToSingle(string? input, string expected)
    {
        var result = TextNormalizer.CollapseWhitespace(input);
        Assert.Equal(expected, result);
    }
}
