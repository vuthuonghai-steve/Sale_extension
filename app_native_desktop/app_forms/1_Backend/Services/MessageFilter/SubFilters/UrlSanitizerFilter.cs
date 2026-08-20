using System.Text.RegularExpressions;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Shared.Models.MessageFilter;

namespace AppForms.Backend.Services.MessageFilter.SubFilters;

/// <summary>
/// Sub-module làm sạch URL tracking parameters (utm_*, fbclid, gclid, ref...)
/// </summary>
public class UrlSanitizerFilter : IClipboardFilter
{
    private static readonly TimeSpan DefaultRegexTimeout = TimeSpan.FromMilliseconds(250);

    public string Name => "URL Tracking Sanitizer Filter";
    public int Priority => 6;

    public bool IsEnabled(FilterPipelineOptions options) => options.EnableUrlSanitizer;

    private static readonly Regex UrlTrackingRegex = new(
        @"([?&])(utm_[^&]+|fbclid=[^&]+|gclid=[^&]+|ref=[^&]+)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled | RegexOptions.CultureInvariant,
        DefaultRegexTimeout
    );

    private static readonly Regex TrailingQuestionRegex = new(
        @"\?$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant,
        DefaultRegexTimeout
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
