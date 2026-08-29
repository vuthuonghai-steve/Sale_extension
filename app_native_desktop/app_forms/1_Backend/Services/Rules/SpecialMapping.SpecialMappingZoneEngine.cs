using AppForms.Backend.Contracts.Rules;
using AppForms.Backend.Services.Rules.Definitions;

namespace AppForms.Backend.Services.Rules;

/// <summary>
/// Domain Engine điều phối các quy tắc phân vùng (Zone Rules) chuẩn hóa mã phòng đặc thù.
/// Sắp xếp và thực thi theo độ ưu tiên Priority giảm dần.
/// </summary>
public class SpecialMappingZoneEngine
{
    private readonly List<ISpecialMappingZoneRule> _rules;

    public SpecialMappingZoneEngine(IEnumerable<ISpecialMappingZoneRule>? rules = null)
    {
        if (rules != null)
        {
            _rules = rules.OrderByDescending(r => r.Priority).ToList();
        }
        else
        {
            // Đăng ký mặc định các rules nền tảng
            _rules = new List<ISpecialMappingZoneRule>
            {
                new TL21PrefixStrippingZoneRule()
            }.OrderByDescending(r => r.Priority).ToList();
        }
    }

    /// <summary>
    /// Phân giải mã đầu vào qua các quy tắc phân vùng và trả về danh sách mã ứng viên khả dĩ.
    /// </summary>
    /// <param name="rawCode">Mã phòng đầu vào (ví dụ: 'C454', 'c-454').</param>
    /// <returns>Tập hợp các mã ứng viên duy nhất đã bóc tách/chuẩn hóa.</returns>
    public IReadOnlyList<string> ResolveCandidateCodes(string rawCode)
    {
        if (string.IsNullOrWhiteSpace(rawCode))
        {
            return Array.Empty<string>();
        }

        var resultSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var rule in _rules)
        {
            if (rule.TryResolveCandidates(rawCode, out var candidates))
            {
                foreach (var candidate in candidates)
                {
                    if (!string.IsNullOrWhiteSpace(candidate))
                    {
                        resultSet.Add(candidate.Trim());
                    }
                }
            }
        }

        return resultSet.ToList();
    }
}
