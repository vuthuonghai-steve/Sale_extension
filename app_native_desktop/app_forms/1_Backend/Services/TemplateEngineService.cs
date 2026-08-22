using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Interfaces;

namespace AppForms.Backend.Services;

public class TemplateEngineService : ITemplateEngine
{
    public string Render(LeadEntity lead, FormatSchema schema, string? fixedCtvName = null)
    {
        var lines = new List<string>();

        // 1. Header
        if (!string.IsNullOrWhiteSpace(schema.HeaderTemplate))
        {
            lines.Add(schema.HeaderTemplate);
        }

        // 2. Fields
        foreach (var field in schema.Fields)
        {
            string? rawValue = null;

            // Xử lý cố định trường CTV / salesName
            if (string.Equals(field.Key, "salesName", StringComparison.OrdinalIgnoreCase))
            {
                if (!string.IsNullOrWhiteSpace(fixedCtvName))
                {
                    rawValue = fixedCtvName.Trim();
                }
                else if (schema.DefaultValues.TryGetValue("salesName", out var defaultSales) && !string.IsNullOrWhiteSpace(defaultSales))
                {
                    rawValue = defaultSales.Trim();
                }
                else if (!string.IsNullOrWhiteSpace(lead.SalesName))
                {
                    rawValue = lead.SalesName.Trim();
                }
            }
            else
            {
                // Tìm theo primary key
                var primaryVal = lead.GetValueByKey(field.Key);
                if (!string.IsNullOrWhiteSpace(primaryVal))
                {
                    rawValue = primaryVal.Trim();
                }

                // Fallback key
                if (string.IsNullOrWhiteSpace(rawValue) && !string.IsNullOrWhiteSpace(field.FallbackTo))
                {
                    var fallbackVal = lead.GetValueByKey(field.FallbackTo);
                    if (!string.IsNullOrWhiteSpace(fallbackVal))
                    {
                        rawValue = fallbackVal.Trim();
                    }
                }

                // Schema Default value
                if (string.IsNullOrWhiteSpace(rawValue) && schema.DefaultValues.TryGetValue(field.Key, out var defaultVal))
                {
                    if (!string.IsNullOrWhiteSpace(defaultVal))
                    {
                        rawValue = defaultVal.Trim();
                    }
                }
            }

            // Xử lý đặc biệt riêng của TL21: Output mã phòng khi có tiền tố "C" / "c" -> chỉ giữ lại mã số không giữ lại chữ
            if (string.Equals(schema.Id, "tl21_house", StringComparison.OrdinalIgnoreCase) &&
                string.Equals(field.Key, "roomCode", StringComparison.OrdinalIgnoreCase) &&
                !string.IsNullOrWhiteSpace(rawValue))
            {
                rawValue = FormatTL21RoomCode(rawValue);
            }

            var prefix = field.Prefix ?? string.Empty;
            var suffix = field.Suffix ?? string.Empty;
            var finalVal = rawValue ?? string.Empty;

            lines.Add($"{prefix}{finalVal}{suffix}");
        }

        // 3. Footer
        if (!string.IsNullOrWhiteSpace(schema.FooterTemplate))
        {
            lines.Add(schema.FooterTemplate);
        }

        return string.Join(Environment.NewLine, lines);
    }

    /// <summary>
    /// Chuẩn hóa mã phòng cho schema TL21House: Nếu bắt đầu bằng 'C' hoặc 'c' thì loại bỏ chữ C/c và giữ lại mã số
    /// </summary>
    private static string FormatTL21RoomCode(string roomCode)
    {
        var trimmed = roomCode.Trim();
        // Khớp C101, c205, C-01, C_302, c 12, C383, c-402b...
        if (System.Text.RegularExpressions.Regex.IsMatch(trimmed, @"^[cC]\s*[-_]?\s*\d+", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
        {
            return System.Text.RegularExpressions.Regex.Replace(trimmed, @"^[cC]\s*[-_]?\s*", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        }
        return trimmed;
    }

    public Dictionary<string, string> RenderAll(LeadEntity lead, IEnumerable<FormatSchema> schemas, string? fixedCtvName = null)
    {
        var outputs = new Dictionary<string, string>();
        foreach (var schema in schemas)
        {
            outputs[schema.Id] = Render(lead, schema, fixedCtvName);
        }
        return outputs;
    }
}
