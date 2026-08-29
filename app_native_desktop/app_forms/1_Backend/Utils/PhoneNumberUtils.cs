using System.Text.RegularExpressions;

namespace AppForms.Backend.Utils;

/// <summary>
/// Tiện ích dùng chung bóc tách, chuẩn hóa và kiểm tra tính hợp lệ của Số điện thoại Việt Nam.
/// </summary>
public static class PhoneNumberUtils
{
    private static readonly Regex VietnamesePhoneRegex = new(@"(?:(?:\+84|84|0)[3|5|7|8|9][0-9]{8})\b", RegexOptions.Compiled);
    private static readonly Regex PhoneTokenRegex = new(@"(0|\+84)\d{9,10}", RegexOptions.Compiled);
    private static readonly Regex NonDigitRegex = new(@"[^\d]", RegexOptions.Compiled);

    /// <summary>
    /// Bóc tách số điện thoại di động Việt Nam (10 chữ số) đầu tiên xuất hiện trong chuỗi.
    /// </summary>
    public static string? ExtractPhoneNumber(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;

        var match = VietnamesePhoneRegex.Match(text);
        if (match.Success)
        {
            return match.Value;
        }

        var fallbackMatch = PhoneTokenRegex.Match(text);
        return fallbackMatch.Success ? fallbackMatch.Value : null;
    }

    /// <summary>
    /// Chuẩn hóa số điện thoại về dạng 10 chữ số chuẩn bắt đầu bằng '0'.
    /// Ví dụ: "+84977274446" -> "0977274446", "84977274446" -> "0977274446", "0977.274.446" -> "0977274446".
    /// </summary>
    public static string Standardize(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return string.Empty;

        var digits = NonDigitRegex.Replace(phone.Trim(), "");
        if (digits.StartsWith("84") && digits.Length == 11)
        {
            digits = "0" + digits.Substring(2);
        }

        return digits;
    }

    /// <summary>
    /// Kiểm tra xem chuỗi có phải là số điện thoại di động Việt Nam hợp lệ (10 chữ số, đầu số 03, 05, 07, 08, 09) hay không.
    /// </summary>
    public static bool IsValidVietnamesePhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return false;
        var clean = Standardize(phone);
        return clean.Length == 10 && Regex.IsMatch(clean, @"^0[3|5|7|8|9]\d{8}$");
    }
}
