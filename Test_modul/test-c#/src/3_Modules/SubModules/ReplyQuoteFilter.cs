using ClipboardFilterApp.Contracts;
using ClipboardFilterApp.Modules.SubModules.Helpers;

namespace ClipboardFilterApp.Modules.SubModules;

/// <summary>
/// Sub-module loại bỏ phần banner header trích dẫn tin nhắn cũ của Zalo
/// </summary>
public class ReplyQuoteFilter : IClipboardFilter
{
    public string Name => "Zalo Reply Quote Stripper";
    public int Priority => 2;

    public string Process(string text)
    {
        if (string.IsNullOrEmpty(text)) return text;
        return FilterRegexPatterns.ReplyQuoteRegex.Replace(text, "");
    }
}
