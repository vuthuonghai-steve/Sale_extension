using System.Text.RegularExpressions;
using AppForms.Backend.Contracts.Rules;
using AppForms.Backend.Utils;

namespace AppForms.Backend.Services.Rules.Definitions;

/// <summary>
/// Quy tắc phân vùng TL21: Bóc tách tiền tố 'C' hoặc 'c' (C454, c454, C-454, C 454...) 
/// để đối chiếu mã số gốc (454) trong kho mapping đặc biệt mà không làm ô nhiễm dữ liệu gốc.
/// </summary>
public class TL21PrefixStrippingZoneRule : ISpecialMappingZoneRule
{
    private static readonly Regex CPrefixRegex = new(@"^[cC](?:[-_]|\s*)?(\d+[a-zA-Z0-9\-_/]*)$", RegexOptions.Compiled);

    public string ZoneName => "TL21_CPrefix_Stripping_Zone";

    // Priority cao (100) để kích hoạt chuẩn hóa tiền tố trước
    public int Priority => 100;

    public bool TryResolveCandidates(string rawCode, out IEnumerable<string> candidateCodes)
    {
        candidateCodes = Enumerable.Empty<string>();

        if (string.IsNullOrWhiteSpace(rawCode))
        {
            return false;
        }

        var cleaned = TextNormalizer.CleanCode(rawCode);
        if (string.IsNullOrEmpty(cleaned))
        {
            return false;
        }

        var match = CPrefixRegex.Match(cleaned);
        if (match.Success && match.Groups.Count > 1)
        {
            var strippedCode = match.Groups[1].Value.Trim();
            if (!string.IsNullOrEmpty(strippedCode))
            {
                var candidates = new List<string> { strippedCode };

                // Nếu có dấu gạch nối bên trong mã con, thêm biến thể bỏ dấu gạch nối
                var noHyphen = strippedCode.Replace("-", "");
                if (noHyphen != strippedCode && !string.IsNullOrEmpty(noHyphen))
                {
                    candidates.Add(noHyphen);
                }

                candidateCodes = candidates;
                return true;
            }
        }

        return false;
    }
}
