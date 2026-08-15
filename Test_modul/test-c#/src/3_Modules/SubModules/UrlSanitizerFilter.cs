using System.Text.RegularExpressions;
using ClipboardFilterApp.Contracts;

namespace ClipboardFilterApp.Modules.SubModules;

public class UrlSanitizerFilter : IClipboardFilter
{
    public string Name => "URL Tracking Sanitizer Filter";
    public int Priority => 6;

    public bool IsEnabled(FilterOptions options) => options.EnableUrlSanitizer;

    private static readonly Regex UrlTrackingRegex = new(
        @"([?&])(utm_[^&]+|fbclid=[^&]+|gclid=[^&]+|ref=[^&]+)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled | RegexOptions.CultureInvariant
    );

    private static readonly Regex TrailingQuestionRegex = new(
        @"\?$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant
    );

    public string Process(string text)
    {
        if (string.IsNullOrEmpty(text)) return text;

        if (text.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || 
            text.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            string cleaned = UrlTrackingRegex.Replace(text, "");
            return TrailingQuestionRegex.Replace(cleaned, "");
        }

        return text;
    }
}
