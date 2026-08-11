using System.Text.RegularExpressions;

namespace AppForms.Backend.Utils;

public static class StringUtils
{
    public static string Truncate(string input, int maxLength, string suffix = "...")
    {
        if (string.IsNullOrEmpty(input) || input.Length <= maxLength)
            return input;

        return string.Concat(input.AsSpan(0, maxLength), suffix);
    }

    public static string NormalizeLineEndings(string input)
    {
        if (string.IsNullOrEmpty(input)) return string.Empty;
        return Regex.Replace(input, @"\r\n?|\n", Environment.NewLine);
    }

    public static bool IsJson(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return false;
        var trimmed = input.Trim();
        return (trimmed.StartsWith("{") && trimmed.EndsWith("}")) ||
               (trimmed.StartsWith("[") && trimmed.EndsWith("]"));
    }
}
