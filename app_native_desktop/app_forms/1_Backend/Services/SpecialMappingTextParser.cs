using System.Text.RegularExpressions;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Shared.Models.SpecialMapping;

namespace AppForms.Backend.Services;

/// <summary>
/// Thực thi dịch vụ bóc tách Regex và chuẩn hóa token chuỗi thô đối chiếu phòng đặc biệt.
/// Phân tách trách nhiệm khỏi Repository lưu trữ.
/// </summary>
public class SpecialMappingTextParser : ISpecialMappingTextParser
{
    private static readonly Regex PhoneRegex = new(@"(0|\+84)\d{9,10}", RegexOptions.Compiled);
    private static readonly Regex TokenRegex = new(@"[A-Za-z0-9\-_/]+", RegexOptions.Compiled);
    private static readonly Regex NonDigitRegex = new(@"[^\d]", RegexOptions.Compiled);
    private static readonly Regex WhitespaceRegex = new(@"\s+", RegexOptions.Compiled);

    public string CleanCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code)) return string.Empty;
        return WhitespaceRegex.Replace(code.Trim(), "");
    }

    public string CleanPhone(string phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return string.Empty;

        var digits = NonDigitRegex.Replace(phone.Trim(), "");
        if (digits.StartsWith("84") && digits.Length == 11)
        {
            digits = "0" + digits.Substring(2);
        }
        return digits;
    }

    public SpecialRoomMappingEntity? FindMappingInText(string text, ISpecialRoomMappingRepository repository)
    {
        if (string.IsNullOrWhiteSpace(text) || repository == null) return null;

        // 1. Quét tìm số điện thoại trong text
        var phoneMatch = PhoneRegex.Match(text);
        if (phoneMatch.Success)
        {
            var foundByPhone = repository.FindMappingByPhone(phoneMatch.Value);
            if (foundByPhone != null) return foundByPhone;
        }

        // 2. Tách các token từ để kiểm tra mã
        var tokens = TokenRegex.Matches(text)
            .Select(m => m.Value.Trim())
            .Where(t => t.Length >= 2);

        foreach (var token in tokens)
        {
            var found = repository.FindMappingByCode(token);
            if (found != null) return found;
        }

        return null;
    }
}
