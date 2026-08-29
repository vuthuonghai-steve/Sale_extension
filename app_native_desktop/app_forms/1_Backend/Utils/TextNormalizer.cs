using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace AppForms.Backend.Utils;

/// <summary>
/// Tiện ích dùng chung chuẩn hóa chuỗi, loại bỏ dấu tiếng Việt và làm sạch mã định danh.
/// Tập trung hóa logic xử lý chuỗi (DRY) cho toàn bộ tầng Backend.
/// </summary>
public static class TextNormalizer
{
    private static readonly Regex NonAlphanumericRegex = new(@"[^a-z0-9]", RegexOptions.Compiled);
    private static readonly Regex WhitespaceRegex = new(@"\s+", RegexOptions.Compiled);

    /// <summary>
    /// Loại bỏ dấu tiếng Việt khỏi chuỗi theo chuẩn Unicode FormD.
    /// Xử lý đầy đủ các ký tự đặc thù như 'đ' -> 'd', 'Đ' -> 'D'.
    /// </summary>
    public static string RemoveAccents(string? input)
    {
        if (string.IsNullOrEmpty(input)) return string.Empty;

        var normalized = input.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();

        foreach (var c in normalized)
        {
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }

        return sb.ToString()
            .Normalize(NormalizationForm.FormC)
            .Replace("đ", "d")
            .Replace("Đ", "D");
    }

    /// <summary>
    /// Chuẩn hóa nhãn/từ khóa về dạng chữ thường không dấu, loại bỏ toàn bộ ký tự đặc biệt, chỉ giữ lại [a-z0-9].
    /// Phục vụ so khớp từ khóa nhanh O(1).
    /// </summary>
    public static string NormalizeKey(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        var unaccented = RemoveAccents(input);
        return NonAlphanumericRegex.Replace(unaccented.ToLowerInvariant(), "").Trim();
    }

    /// <summary>
    /// Làm sạch mã phòng / mã định danh bằng cách loại bỏ toàn bộ khoảng trắng thừa giữa các ký tự.
    /// Ví dụ: "MN 35" -> "MN35", " C - 101 " -> "C-101".
    /// </summary>
    public static string CleanCode(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return string.Empty;
        return WhitespaceRegex.Replace(code.Trim(), "");
    }

    /// <summary>
    /// Thu gọn các khoảng trắng liền kề thành một khoảng trắng đơn.
    /// </summary>
    public static string CollapseWhitespace(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        return WhitespaceRegex.Replace(input.Trim(), " ");
    }
}
