using System.Text.RegularExpressions;
using AppForms.Backend.Contracts.Rules;

namespace AppForms.Backend.Services.Rules.Definitions;

/// <summary>
/// Quy tắc đặc biệt: Nhận diện mã phòng bắt đầu bằng tiền tố 'C' hoặc 'c' (C101, c205, C-01, C 383...) -> TL21House (tl21_house)
/// </summary>
public class CPrefixTL21SpecialRule : ISpecialRoomCodeRule
{
    public string RuleName => "CPrefix_TL21House_SpecialRule";

    // Priority cao (100) để kích hoạt trước các tra cứu thông thường
    public int Priority => 100;

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

        // Khớp nếu bắt đầu bằng 'c' hoặc 'C' kèm theo số, hoặc dấu gạch nối/gạch dưới + số
        // Ví dụ: C101, c205, C-01, C_02, C383, c12, c402b
        // Tránh false positive với các từ ngữ hoặc mã ký tự như CROSS_..., CAN_HO...
        if (Regex.IsMatch(cleaned, @"^[cC](?:[-_]?\d+[a-zA-Z0-9\-_]*)", RegexOptions.IgnoreCase))
        {
            matchedSchemaId = "tl21_house";
            reason = $"Mã phòng '{roomCode}' khớp quy tắc đặc biệt tiền tố 'C' -> TL21House (tl21_house)";
            return true;
        }

        return false;
    }
}
