using AppForms.Backend.Contracts.Rules;
using AppForms.Backend.Services.Rules.Definitions;

namespace AppForms.Backend.Services.Rules;

/// <summary>
/// Engine điều phối và thực thi các quy tắc nhận diện mã phòng đặc biệt
/// </summary>
public class SpecialRoomCodeRuleEngine
{
    private readonly List<ISpecialRoomCodeRule> _rules;

    public SpecialRoomCodeRuleEngine(IEnumerable<ISpecialRoomCodeRule>? rules = null)
    {
        if (rules != null && rules.Any())
        {
            _rules = rules.OrderByDescending(r => r.Priority).ToList();
        }
        else
        {
            // Default built-in rules nếu không truyền qua DI
            _rules = new List<ISpecialRoomCodeRule>
            {
                new CPrefixTL21SpecialRule(),
                new StandardPrefixRules()
            }.OrderByDescending(r => r.Priority).ToList();
        }
    }

    /// <summary>
    /// Thử so khớp mã phòng qua toàn bộ các quy tắc theo thứ tự ưu tiên
    /// </summary>
    public bool TryMatch(
        string roomCode, 
        out string? matchedSchemaId, 
        out string? reason, 
        out string? matchedRuleName)
    {
        matchedSchemaId = null;
        reason = null;
        matchedRuleName = null;

        if (string.IsNullOrWhiteSpace(roomCode))
        {
            return false;
        }

        foreach (var rule in _rules)
        {
            if (rule.TryMatch(roomCode, out var schemaId, out var matchReason))
            {
                matchedSchemaId = schemaId;
                reason = matchReason;
                matchedRuleName = rule.RuleName;
                return true;
            }
        }

        return false;
    }
}
