using System.Text.RegularExpressions;
using ClipboardFilterApp.Contracts;

namespace ClipboardFilterApp.Modules.SubModules;

public class ZaloStickerFilter : IClipboardFilter
{
    public string Name => "Zalo Sticker & System Tag Filter";
    public int Priority => 2;

    private static readonly Regex ZaloStickerRegex = new(
        @"/\-(?:rose|heart|strong|smile|thanks|break|beer|like|fade|flag|sigh|handclap|kiss|angry|sleep|love|sweat|giggle|cry|cool|funny|bad|pray|shit|pushup|search|pointdown|pointright|pointleft|pointup|v|ghost|demon)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled
    );

    private static readonly Regex ZaloSystemTagsRegex = new(
        @"^[ \t]*\[(?:Hình[ \t]+ảnh|Sticker|File|Video|Thẻ[ \t]+danh[ \t]+thiếp|Vị[ \t]+trí)\][ \t]*$",
        RegexOptions.Multiline | RegexOptions.IgnoreCase | RegexOptions.Compiled
    );

    private static readonly Regex LineSeparatorRegex = new(
        @"^[ \t]*(?:[-=*_~•.]{3,}|(?:🌸|🌺|💐|🌻|🌹|🏆|⭐){3,})[ \t]*$",
        RegexOptions.Multiline | RegexOptions.Compiled
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
