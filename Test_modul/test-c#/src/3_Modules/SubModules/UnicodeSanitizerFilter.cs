using System.Text;
using System.Text.RegularExpressions;
using ClipboardFilterApp.Contracts;

namespace ClipboardFilterApp.Modules.SubModules;

public class UnicodeSanitizerFilter : IClipboardFilter
{
    public string Name => "Unicode Sanitizer Filter";
    public int Priority => 1;

    private static readonly Regex HiddenZeroWidthRegex = new(@"[\u200b\ufeff\ufffd]", RegexOptions.Compiled);

    public string Process(string text)
    {
        if (string.IsNullOrEmpty(text)) return text;

        // Thay non-breaking space thành space chuẩn, xóa zero-width space / BOM
        string cleaned = text.Replace('\xa0', ' ');
        cleaned = HiddenZeroWidthRegex.Replace(cleaned, "");
        
        // Chuẩn hóa Unicode Form C (NFC)
        return cleaned.Normalize(NormalizationForm.FormC);
    }
}
