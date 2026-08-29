using System.Text.RegularExpressions;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Utils;
using AppForms.Shared.Models.SpecialMapping;

namespace AppForms.Backend.Services;

/// <summary>
/// Thực thi dịch vụ bóc tách Regex và chuẩn hóa token chuỗi thô đối chiếu phòng đặc biệt.
/// Phân tách trách nhiệm khỏi Repository lưu trữ.
/// </summary>
public class SpecialMappingTextParser : ISpecialMappingTextParser
{
    private static readonly Regex PhoneRegex = new(@"(0|\+84)\d{9,10}", RegexOptions.Compiled);
    private static readonly Regex ExplicitCodeRegex = new(@"(?:mã\s*phòng|mã\s*tòa|mã\s*nguồn|mã\s*hàng|mã|ms)\s*[:\-]?\s*([A-Za-z0-9\-_/]+)", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex AlphaNumericTokenRegex = new(@"\b[A-Za-z]+[-_]?\d+[A-Za-z0-9\-_/]*\b|\b\d+[-_]?[A-Za-z]+[A-Za-z0-9\-_/]*\b", RegexOptions.Compiled);
    private static readonly Regex NumericCodeTokenRegex = new(@"\b\d{3,}\b", RegexOptions.Compiled);

    public string CleanCode(string code)
    {
        return TextNormalizer.CleanCode(code);
    }

    public string CleanPhone(string phone)
    {
        return PhoneNumberUtils.Standardize(phone);
    }

    public SpecialRoomMappingEntity? FindMappingInText(string text, ISpecialRoomMappingRepository repository)
    {
        if (string.IsNullOrWhiteSpace(text) || repository == null) return null;

        // 1. Quét theo ngữ cảnh từ khóa mã rõ ràng trước (vd: "Mã: AHS284", "Mã phòng: 040")
        var explicitMatches = ExplicitCodeRegex.Matches(text);
        foreach (Match em in explicitMatches)
        {
            if (em.Groups.Count > 1)
            {
                var candidate = em.Groups[1].Value.Trim();
                var found = repository.FindMappingByCode(candidate);
                if (found != null) return found;
            }
        }

        // 2. Quét các token dạng mã có cả chữ và số (vd: AHS284, DN01, A520, Ts007, 007A)
        var alphaMatches = AlphaNumericTokenRegex.Matches(text);
        foreach (Match am in alphaMatches)
        {
            var candidate = am.Value.Trim();
            var found = repository.FindMappingByCode(candidate);
            if (found != null) return found;
        }

        // 3. Quét các mã số thuần túy (yêu cầu tối thiểu 3 chữ số để tránh nhầm số nhà/ngách/ngày/tháng 1-2 chữ số)
        var numericMatches = NumericCodeTokenRegex.Matches(text);
        foreach (Match nm in numericMatches)
        {
            var candidate = nm.Value.Trim();
            var found = repository.FindMappingByCode(candidate);
            if (found != null) return found;
        }

        // 4. Quét tìm số điện thoại Quản lý / Đầu chủ trong text
        var phoneMatch = PhoneRegex.Match(text);
        if (phoneMatch.Success)
        {
            var foundByPhone = repository.FindMappingByPhone(phoneMatch.Value);
            if (foundByPhone != null) return foundByPhone;
        }

        return null;
    }
}
