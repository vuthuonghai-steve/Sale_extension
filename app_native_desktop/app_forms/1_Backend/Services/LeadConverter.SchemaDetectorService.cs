using System.Text.RegularExpressions;
using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Services.Rules;
using AppForms.Backend.Utils;
using AppForms.Shared.Enums;

namespace AppForms.Backend.Services;

/// <summary>
/// Domain Service điều phối phát hiện Schema tương ứng từ LeadEntity và RawText.
/// Tích hợp tập trung SpecialRoomCodeRuleEngine và TextNormalizer để loại bỏ phân tán quy tắc.
/// </summary>
public class SchemaDetectorService : ISchemaDetector
{
    private static readonly Regex TokenCandidateRegex = new(@"\b[A-Za-z0-9\-_/]+\b", RegexOptions.Compiled);

    private readonly IRoomCodeReadOnlyRepository _roomCodeRepo;
    private readonly SpecialRoomCodeRuleEngine _ruleEngine;

    public SchemaDetectorService(
        IRoomCodeReadOnlyRepository roomCodeRepo,
        SpecialRoomCodeRuleEngine? ruleEngine = null)
    {
        _roomCodeRepo = roomCodeRepo;
        _ruleEngine = ruleEngine ?? new SpecialRoomCodeRuleEngine();
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
            // 1.1. Special & Prefix Rules Engine (O(1) Rule Matching & Diagnostic Trace)
            if (_ruleEngine.TryMatch(lead.RoomCode, out var matchedSchemaId, out var reason, out var ruleName))
            {
                return SchemaDetectionResult.Exact(matchedSchemaId!);
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

        // === LAYER 3: Quét rawText qua Rule Engine tập trung ===
        if (!string.IsNullOrWhiteSpace(rawText))
        {
            // 3.1. Quét các token mã trong rawText và đưa qua Rule Engine
            var tokenMatches = TokenCandidateRegex.Matches(rawText);
            foreach (Match match in tokenMatches)
            {
                var token = match.Value;
                if (_ruleEngine.TryMatch(token, out var ruleMatchedSchema, out _, out _))
                {
                    return SchemaDetectionResult.Exact(ruleMatchedSchema!);
                }
            }

            // 3.2. Kiểm tra từ khóa sàn trong rawText
            var detectedFromRaw = DetectFromKeyword(rawText);
            if (detectedFromRaw != null)
            {
                return SchemaDetectionResult.Exact(detectedFromRaw);
            }
        }

        return SchemaDetectionResult.NotFoundResult("Chưa nhận diện được sàn phù hợp từ mã phòng.");
    }

    private static string? DetectFromKeyword(string text)
    {
        var normalized = TextNormalizer.NormalizeKey(text);

        if (normalized.Contains("lusaco")) return "lusaco";
        if (normalized.Contains("hdhome") || normalized.Contains("hdhomes")) return "hd_homes";
        if (normalized.Contains("nthome") || normalized.Contains("nthomes")) return "nt_home";
        if (normalized.Contains("95home") || normalized.Contains("95homes")) return "95_home";
        if (normalized.Contains("tnrhome") || normalized.Contains("tnr")) return "tnr_home";
        if (normalized.Contains("tl21") || normalized.Contains("tl21house")) return "tl21_house";
        if (normalized.Contains("asky") || normalized.Contains("skygroup")) return "a_sky_group";
        if (normalized.Contains("sapphire") || normalized.Contains("sapphirehouse")) return "sapphire_house_tt";
        if (normalized.Contains("tro365") || normalized.Contains("365")) return "tro_365";
        if (normalized.Contains("anhomes") || normalized.Contains("anhome")) return "anhomes";

        return null;
    }
}
