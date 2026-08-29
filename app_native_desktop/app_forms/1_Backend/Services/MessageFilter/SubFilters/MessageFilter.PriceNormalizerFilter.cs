using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Services.MessageFilter.Helpers;
using AppForms.Shared.Models.MessageFilter;

namespace AppForms.Backend.Services.MessageFilter.SubFilters;

/// <summary>
/// Sub-module chuyên biệt chuẩn hóa định dạng giá tiền trong nội dung tin nhắn (VD: 4.000.000, 4.6 tr, 4600000 -> 4tr, 4tr6)
/// </summary>
public class PriceNormalizerFilter : IClipboardFilter
{
    public string Name => "Price Normalizer Filter";
    public int Priority => 7;

    public bool IsEnabled(FilterPipelineOptions options) => options.EnablePriceNormalizer;

    public string Process(string text)
    {
        if (string.IsNullOrEmpty(text)) return text;

        return PriceNormalizerUtil.NormalizePrices(text);
    }
}
