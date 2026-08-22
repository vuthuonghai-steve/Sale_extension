using System.Text.RegularExpressions;
using AppForms.Backend.Contracts.Rules;

namespace AppForms.Backend.Services.Rules.Definitions;

/// <summary>
/// Quy tắc nhận diện tiền tố tiêu chuẩn của các sàn (MN, TS, NT, 95, TL)
/// </summary>
public class StandardPrefixRules : ISpecialRoomCodeRule
{
    public string RuleName => "Standard_Prefix_Signatures_Rule";

    // Priority tiêu chuẩn (50)
    public int Priority => 50;

    public bool TryMatch(string roomCode, out string? matchedSchemaId, out string? reason)
    {
        matchedSchemaId = null;
        reason = null;

        if (string.IsNullOrWhiteSpace(roomCode))
        {
            return false;
        }

        var cleaned = Regex.Replace(roomCode.Trim(), @"\s+", "");
        if (string.IsNullOrEmpty(cleaned))
        {
            return false;
        }

        // Mã "Mn xxx" -> Lusaco (ví dụ: Mn35, Mn 35, mn12)
        if (cleaned.StartsWith("mn", StringComparison.OrdinalIgnoreCase))
        {
            matchedSchemaId = "lusaco";
            reason = $"Tiền tố 'MN' khớp sàn Lusaco";
            return true;
        }

        // Mã "Tsxxx" -> HD Homes (ví dụ: Ts007, Ts 007, ts12)
        if (cleaned.StartsWith("ts", StringComparison.OrdinalIgnoreCase))
        {
            matchedSchemaId = "hd_homes";
            reason = $"Tiền tố 'TS' khớp sàn HD Homes";
            return true;
        }

        // Mã "NTxxx" -> NT HOME (ví dụ: NT023, NT 023, nt01)
        if (cleaned.StartsWith("nt", StringComparison.OrdinalIgnoreCase))
        {
            matchedSchemaId = "nt_home";
            reason = $"Tiền tố 'NT' khớp sàn NT HOME";
            return true;
        }

        // Tiền tố 95 -> 95 HOME
        if (cleaned.StartsWith("95", StringComparison.OrdinalIgnoreCase))
        {
            matchedSchemaId = "95_home";
            reason = $"Tiền tố '95' khớp sàn 95 HOME";
            return true;
        }

        // Tiền tố TL -> TL21House
        if (cleaned.StartsWith("tl", StringComparison.OrdinalIgnoreCase))
        {
            matchedSchemaId = "tl21_house";
            reason = $"Tiền tố 'TL' khớp sàn TL21House";
            return true;
        }

        return false;
    }
}
