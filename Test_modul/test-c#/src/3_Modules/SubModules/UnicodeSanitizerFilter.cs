using System.Text;
using System.Text.RegularExpressions;
using ClipboardFilterApp.Contracts;

namespace ClipboardFilterApp.Modules.SubModules;

public class UnicodeSanitizerFilter : IClipboardFilter
{
    public string Name => "Unicode Sanitizer Filter";
    public int Priority => 1;
    public bool IsEnabled(FilterOptions options) => options.EnableUnicodeSanitizer;

    public string Process(string text)
    {
        if (string.IsNullOrEmpty(text)) return text;

        // Thay non-breaking space thành space chuẩn, xóa zero-width space / BOM / replacement char
        string cleaned = text.Replace('\xa0', ' ')
                             .Replace("\u200b", "")
                             .Replace("\ufeff", "")
                             .Replace("\ufffd", "");
        
        // Chuẩn hóa Unicode Form C (NFC)
        return cleaned.Normalize(NormalizationForm.FormC);
    }
}
