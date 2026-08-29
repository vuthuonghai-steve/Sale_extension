using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Services.MessageFilter.Helpers;
using AppForms.Shared.Models.MessageFilter;

namespace AppForms.Backend.Services.MessageFilter.SubFilters;

/// <summary>
/// Sub-module loại bỏ phần banner header trích dẫn tin nhắn cũ của Zalo
/// </summary>
public class ReplyQuoteFilter : IClipboardFilter
{
    public string Name => "Zalo Reply Quote Stripper";
    public int Priority => 2;
    public bool IsEnabled(FilterPipelineOptions options) => options.EnableReplyQuoteFilter;

    public string Process(string text)
    {
        if (string.IsNullOrEmpty(text)) return text;
        return FilterRegexPatterns.ReplyQuoteRegex.Replace(text, "");
    }
}
