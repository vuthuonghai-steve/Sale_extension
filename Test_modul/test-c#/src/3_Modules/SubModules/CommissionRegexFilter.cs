using System.Text.RegularExpressions;
using ClipboardFilterApp.Contracts;

namespace ClipboardFilterApp.Modules.SubModules;

public class CommissionRegexFilter : IClipboardFilter
{
    public string Name => "Commission & Owner Detail Filter";
    public int Priority => 3;

    private static readonly Regex CommissionPattern = new(
        @"(?:(?:(?:hh|hoa[ \t]*hồng):?|(?:\/-[a-z0-9_]+|(?:🌷|🌸|🌺|🌻|🌹|💐)))[ \t]*(?:(?:hh|hoa[ \t]*hồng):?[ \t]*)?(?:\d{1,3}[ \t]*%|\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*)|\d{1,3}[ \t]*%)" +
        @"[ \t]*(?:[-–—]?[ \t]*(?:hd|hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—]+(?:[ \t]*[-–—][ \t]*[\d\/\.]+)*[ \t]*(?:m|t|th|tháng|năm)?)?" +
        @"[ \t]*(?:\([ \t]*(?:chủ[ \t]*dẫn|cd|chốt|chốt[ \t]*ở)?:?[ \t]*(?:\d{1,3}[ \t]*%|\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*|.*?)[ \t]*(?:[-–—]?[ \t]*(?:hd|hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—]+(?:[ \t]*[-–—][ \t]*[\d\/\.]+)*[ \t]*(?:m|t|th|tháng|năm)?)?[ \t]*\)|(?:[-–—][ \t]*)?(?:chủ[ \t]*dẫn|cd|chốt|chốt[ \t]*ở):?[ \t]*(?:\d{1,3}[ \t]*%|\d+(?:[\.,]\d+)?[ \t]*(?:tr|triệu|k)[ \t]*\d*)[ \t]*(?:[-–—]?[ \t]*(?:hd|hạn|hợp[ \t]*đồng|thời[ \t]*hạn)?[ \t]*(?:tới|toi|đến|den)?[ \t]*[\d\/\.\-–—]+(?:[ \t]*[-–—][ \t]*[\d\/\.]+)*[ \t]*(?:m|t|th|tháng|năm)?)?)?" +
        @"[ \t]*(?:[\.\-–—][ \t]*)?(?=[ \t]*[-([{:–— \t]*mã:?|[ \t]*\n|$)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled
    );

    public string Process(string text)
    {
        if (string.IsNullOrEmpty(text)) return text;
        return CommissionPattern.Replace(text, "");
    }
}
