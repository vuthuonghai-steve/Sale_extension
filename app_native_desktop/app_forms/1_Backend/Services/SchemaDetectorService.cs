using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Shared.Enums;

namespace AppForms.Backend.Services;

public class SchemaDetectorService : ISchemaDetector
{
    private readonly IRoomCodeReadOnlyRepository _roomCodeRepo;

    public SchemaDetectorService(IRoomCodeReadOnlyRepository roomCodeRepo)
    {
        _roomCodeRepo = roomCodeRepo;
    }

    public string? DetectSchemaId(LeadEntity lead, string? rawText = null)
    {
        var result = DetectSchemaWithDetails(lead, rawText);
        return result.Status == SchemaDetectionStatus.ExactMatch ? result.MatchedSchemaId : null;
    }

    public SchemaDetectionResult DetectSchemaWithDetails(LeadEntity lead, string? rawText = null)
    {
        // === LAYER 1: RoomCode Tra cứu & Phân giải ===
        if (!string.IsNullOrWhiteSpace(lead.RoomCode))
        {
            // 1.1. Prefix Signature Pattern Matching (O(1) Regex/Prefix)
            var detectedFromPrefix = DetectFromPrefixSignature(lead.RoomCode);
            if (detectedFromPrefix != null)
            {
                return SchemaDetectionResult.Exact(detectedFromPrefix);
            }

            // 1.2. Tra cứu In-Memory Code Registry (O(1) RAM)
            var candidates = _roomCodeRepo.GetSchemaIdsByCode(lead.RoomCode);
            if (candidates.Count == 1)
            {
                return SchemaDetectionResult.Exact(candidates[0]);
            }
            if (candidates.Count > 1)
            {
                var groupNames = candidates
                    .Select(id => _roomCodeRepo.GetGroupName(id) ?? id)
                    .ToList();
                var conflictMsg = $"Mã '{lead.RoomCode}' thuộc nhiều sàn ({string.Join(", ", groupNames)}). Vui lòng chọn sàn thủ công.";
                return SchemaDetectionResult.Conflict(candidates, conflictMsg);
            }
        }

        // === LAYER 2: Kiểm tra theo TeamName ===
        if (!string.IsNullOrWhiteSpace(lead.TeamName))
        {
            var detectedFromTeam = DetectFromKeyword(lead.TeamName);
            if (detectedFromTeam != null)
            {
                return SchemaDetectionResult.Exact(detectedFromTeam);
            }
        }

        // === LAYER 3: Quét rawText nếu được cung cấp ===
        if (!string.IsNullOrWhiteSpace(rawText))
        {
            // Kiểm tra các mẫu regex mã phòng trong rawText
            // Ví dụ: Mn35, Mn 35, Ts007, NT023
            var matchMn = Regex.Match(rawText, @"\bmn\s*\d+", RegexOptions.IgnoreCase);
            if (matchMn.Success) return SchemaDetectionResult.Exact("lusaco");

            var matchTs = Regex.Match(rawText, @"\bts\s*\d+", RegexOptions.IgnoreCase);
            if (matchTs.Success) return SchemaDetectionResult.Exact("hd_homes");

            var matchNt = Regex.Match(rawText, @"\bnt\s*\d+", RegexOptions.IgnoreCase);
            if (matchNt.Success) return SchemaDetectionResult.Exact("nt_home");

            // Kiểm tra từ khóa sàn trong rawText
            var detectedFromRaw = DetectFromKeyword(rawText);
            if (detectedFromRaw != null)
            {
                return SchemaDetectionResult.Exact(detectedFromRaw);
            }
        }

        return SchemaDetectionResult.NotFoundResult("Chưa nhận diện được sàn phù hợp từ mã phòng.");
    }

    private static string? DetectFromPrefixSignature(string roomCode)
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
