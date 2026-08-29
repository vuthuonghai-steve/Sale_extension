using AppForms.Backend.Utils;
using Xunit;

namespace AppForms.Tests.Backend;

public class PhoneNumberUtilsTests
{
    [Theory]
    [InlineData("Khách gọi 0977274446 lúc sáng", "0977274446")]
    [InlineData("SĐT: +84912345678", "+84912345678")]
    [InlineData("Hotline 84388999888 cần tư vấn", "84388999888")]
    [InlineData("Không có số điện thoại", null)]
    [InlineData("", null)]
    [InlineData(null, null)]
    public void ExtractPhoneNumber_ExtractsValidPhoneFromText(string? input, string? expected)
    {
        var result = PhoneNumberUtils.ExtractPhoneNumber(input);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("0977274446", "0977274446")]
    [InlineData("+84977274446", "0977274446")]
    [InlineData("84977274446", "0977274446")]
    [InlineData("0977.274.446", "0977274446")]
    [InlineData("0977 274 446", "0977274446")]
    [InlineData("", "")]
    [InlineData(null, "")]
    public void Standardize_StandardizesToTenDigitsStartingWithZero(string? input, string expected)
    {
        var result = PhoneNumberUtils.Standardize(input);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("0977274446", true)]
    [InlineData("+84977274446", true)]
    [InlineData("0388999888", true)]
    [InlineData("0588999888", true)]
    [InlineData("0788999888", true)]
    [InlineData("0888999888", true)]
    [InlineData("0123456789", false)] // Invalid prefix 01
    [InlineData("123456", false)] // Short
    [InlineData("0977274446999", false)] // Too long
    [InlineData("", false)]
    [InlineData(null, false)]
    public void IsValidVietnamesePhone_ValidatesCorrectly(string? input, bool expected)
    {
        var result = PhoneNumberUtils.IsValidVietnamesePhone(input);
        Assert.Equal(expected, result);
    }
}
