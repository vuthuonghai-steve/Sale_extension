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
