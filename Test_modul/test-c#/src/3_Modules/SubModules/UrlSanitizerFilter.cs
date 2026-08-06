using System.Text.RegularExpressions;
using ClipboardFilterApp.Contracts;

namespace ClipboardFilterApp.Modules.SubModules;

public class UrlSanitizerFilter : IClipboardFilter
{
    public string Name => "URL Tracking Sanitizer Filter";
    public int Priority => 4;

    private static readonly Regex UrlTrackingRegex = new(
        @"([?&])(utm_[^&]+|fbclid=[^&]+|gclid=[^&]+|ref=[^&]+)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled
    );

    private static readonly Regex TrailingQuestionRegex = new(
        @"\?$",
        RegexOptions.Compiled
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
