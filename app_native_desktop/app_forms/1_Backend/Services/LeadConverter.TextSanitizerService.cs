using System.Text.RegularExpressions;
using AppForms.Backend.Contracts.Interfaces;

namespace AppForms.Backend.Services;

public class TextSanitizerService : ITextSanitizer
{
    public string RemoveHiddenChars(string text)
    {
        if (string.IsNullOrEmpty(text)) return string.Empty;

        return text
            .Replace("\u200B", "") // Zero width space
            .Replace("\u200C", "") // Zero width non-joiner
            .Replace("\u200D", "") // Zero width joiner
            .Replace("\uFEFF", "") // Zero width no-break space (BOM)
            .Replace("\u00A0", " ") // Non-breaking space
            .Normalize(System.Text.NormalizationForm.FormC);
    }

    public string CleanWhitespace(string text)
    {
        if (string.IsNullOrEmpty(text)) return string.Empty;

        var lines = text.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None)
            .Select(line => line.Trim())
            .ToList();

        var cleaned = new List<string>();
        foreach (var line in lines)
        {
            if (!string.IsNullOrEmpty(line) || (cleaned.Count > 0 && !string.IsNullOrEmpty(cleaned[^1])))
            {
                cleaned.Add(line);
            }
        }

        return string.Join(Environment.NewLine, cleaned).Trim();
    }

    public string Sanitize(string text)
    {
        return CleanWhitespace(RemoveHiddenChars(text));
    }
}
