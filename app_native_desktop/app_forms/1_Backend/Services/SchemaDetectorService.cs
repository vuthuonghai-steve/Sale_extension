using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Interfaces;

namespace AppForms.Backend.Services;

public class SchemaDetectorService : ISchemaDetector
{
    public string? DetectSchemaId(LeadEntity lead, string? rawText = null)
    {
        // 1. Kiểm tra ưu tiên theo RoomCode nếu có
        if (!string.IsNullOrWhiteSpace(lead.RoomCode))
        {
            var detectedFromCode = DetectFromCode(lead.RoomCode);
            if (detectedFromCode != null)
            {
                return detectedFromCode;
            }
        }

        // 2. Kiểm tra theo TeamName
        if (!string.IsNullOrWhiteSpace(lead.TeamName))
        {
            var detectedFromTeam = DetectFromKeyword(lead.TeamName);
            if (detectedFromTeam != null)
            {
                return detectedFromTeam;
            }
        }

        // 3. Quét rawText nếu được cung cấp
        if (!string.IsNullOrWhiteSpace(rawText))
        {
            // Kiểm tra các mẫu regex mã phòng trong rawText
            // Ví dụ: Mn35, Mn 35, Ts007, NT023
            var matchMn = Regex.Match(rawText, @"\bmn\s*\d+", RegexOptions.IgnoreCase);
            if (matchMn.Success) return "lusaco";

            var matchTs = Regex.Match(rawText, @"\bts\s*\d+", RegexOptions.IgnoreCase);
            if (matchTs.Success) return "hd_homes";

            var matchNt = Regex.Match(rawText, @"\bnt\s*\d+", RegexOptions.IgnoreCase);
            if (matchNt.Success) return "nt_home";

            // Kiểm tra từ khóa sàn trong rawText
            var detectedFromRaw = DetectFromKeyword(rawText);
            if (detectedFromRaw != null)
            {
                return detectedFromRaw;
            }
        }

        return null;
    }

    private static string? DetectFromCode(string roomCode)
    {
        var cleaned = CleanCode(roomCode);
        if (string.IsNullOrEmpty(cleaned)) return null;

        // Mã "Mn xxx" -> Lusaco (ví dụ: Mn35, Mn 35, mn12)
        if (cleaned.StartsWith("mn", StringComparison.OrdinalIgnoreCase))
        {
            return "lusaco";
        }

        // Mã "Tsxxx" -> HD Homes (ví dụ: Ts007, Ts 007, ts12)
        if (cleaned.StartsWith("ts", StringComparison.OrdinalIgnoreCase))
        {
            return "hd_homes";
        }

        // Mã "NTxxx" -> NT HOME (ví dụ: NT023, NT 023, nt01)
        if (cleaned.StartsWith("nt", StringComparison.OrdinalIgnoreCase))
        {
            return "nt_home";
        }

        // Tiền tố 95 -> 95 HOME
        if (cleaned.StartsWith("95", StringComparison.OrdinalIgnoreCase))
        {
            return "95_home";
        }

        // Tiền tố TL -> TL21House
        if (cleaned.StartsWith("tl", StringComparison.OrdinalIgnoreCase))
        {
            return "tl21_house";
        }

        return null;
    }

    private static string? DetectFromKeyword(string text)
    {
        var normalized = Normalize(text);

        if (normalized.Contains("lusaco")) return "lusaco";
        if (normalized.Contains("hdhome") || normalized.Contains("hdhomes")) return "hd_homes";
        if (normalized.Contains("nthome") || normalized.Contains("nthomes")) return "nt_home";
        if (normalized.Contains("95home") || normalized.Contains("95homes")) return "95_home";
        if (normalized.Contains("tnrhome") || normalized.Contains("tnr")) return "tnr_home";
        if (normalized.Contains("tl21") || normalized.Contains("tl21house")) return "tl21_house";
        if (normalized.Contains("asky") || normalized.Contains("skygroup")) return "a_sky_group";

        return null;
    }

    private static string CleanCode(string code)
    {
        return Regex.Replace(code.Trim(), @"\s+", "");
    }

    private static string Normalize(string str)
    {
        if (string.IsNullOrEmpty(str)) return string.Empty;
        var normalized = str.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var c in normalized)
        {
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }
        var unaccented = sb.ToString().Normalize(NormalizationForm.FormC).Replace("đ", "d").Replace("Đ", "D");
        return Regex.Replace(unaccented.ToLowerInvariant(), @"[^a-z0-9]", "").Trim();
    }
}
