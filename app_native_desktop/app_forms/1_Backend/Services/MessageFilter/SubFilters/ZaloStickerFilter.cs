using System.Text.RegularExpressions;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Shared.Models.MessageFilter;

namespace AppForms.Backend.Services.MessageFilter.SubFilters;

/// <summary>
/// Sub-module lọc sticker Zalo và các tag phân cách hệ thống
/// </summary>
public class ZaloStickerFilter : IClipboardFilter
{
    private static readonly TimeSpan DefaultRegexTimeout = TimeSpan.FromMilliseconds(250);

    public string Name => "Zalo Sticker & System Tag Filter";
    public int Priority => 3;

    public bool IsEnabled(FilterPipelineOptions options) => options.EnableZaloStickerFilter;

    private static readonly Regex ZaloStickerRegex = new(
        @"/\-(?:rose|heart|strong|smile|thanks|break|beer|like|fade|flag|sigh|handclap|kiss|angry|sleep|love|sweat|giggle|cry|cool|funny|bad|pray|shit|pushup|search|pointdown|pointright|pointleft|pointup|v|ghost|demon)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled | RegexOptions.CultureInvariant,
        DefaultRegexTimeout
    );

    private static readonly Regex ZaloSystemTagsRegex = new(
        @"^[ \t]*\[(?:Hình[ \t]+ảnh|Sticker|File|Video|Thẻ[ \t]+danh[ \t]+thiếp|Vị[ \t]+trí)\][ \t]*$",
        RegexOptions.Multiline | RegexOptions.IgnoreCase | RegexOptions.Compiled | RegexOptions.CultureInvariant,
        DefaultRegexTimeout
    );

    private static readonly Regex LineSeparatorRegex = new(
        @"^[ \t]*(?:[-=*_~•.]{3,}|(?:🌸|🌺|💐|🌻|🌹|🏆|⭐){3,})[ \t]*$",
        RegexOptions.Multiline | RegexOptions.Compiled | RegexOptions.CultureInvariant,
        DefaultRegexTimeout
    );

    public string Process(string text)
    {
        if (string.IsNullOrEmpty(text)) return text;

        string cleaned = ZaloStickerRegex.Replace(text, "");
        cleaned = ZaloSystemTagsRegex.Replace(cleaned, "");
        cleaned = LineSeparatorRegex.Replace(cleaned, "");

        return cleaned;
    }
}
