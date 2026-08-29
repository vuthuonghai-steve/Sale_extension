using System.Globalization;
using System.Text.RegularExpressions;

namespace AppForms.Backend.Services.MessageFilter.Helpers;

/// <summary>
/// Util chuyên biệt phục vụ nhận diện, bóc tách và chuẩn hóa định dạng giá tiền trong tin nhắn bất động sản / bán hàng
/// </summary>
public static class PriceNormalizerUtil
{
    private static readonly TimeSpan DefaultRegexTimeout = TimeSpan.FromMilliseconds(250);

    // 1. Dạng triệu có phân cách chấm/phẩy hoặc số liền: 4.000.000, 4,000,000, 4.600.000, 4,600,000, 4600000, 12.500.000
    // Điều kiện: Bắt đầu từ 1.000.000 đến 999.000.000, không đứng sau ký tự chữ/số (để tránh dính mã thẻ, số tài khoản, số điện thoại)
    private static readonly Regex FullMillionRegex = new(
        @"(?<![\d\w\.\,\/])([1-9]\d{0,2}(?:[\.\,]\d{3}){2}|[1-9]\d{6,8})(?:[ \t]*(?:đ|vnđ|vnd|VND|Đ|VNĐ))?(?=(?:[ \t]*\/(?:tháng|th|t|phòng|căn|p|người|ng|năm)|[ \t]*[-–—][ \t]*[pP]?\d+|[ \t]*(?:\n|$|[,\.;\)\}\]\+\*☘\s])))",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase,
        DefaultRegexTimeout
    );

    // 2. Dạng số thập phân hoặc nguyên có đơn vị tr/triệu: 4.6 tr, 4.6tr, 4,6 tr, 4.6 triệu, 4.0 tr, 4 tr, 4 triệu, 4.65 tr, 12.5 triệu
    private static readonly Regex DecimalMillionRegex = new(
        @"(?<![\d\w\.\,\/])([1-9]\d{0,2}(?:[\.\,]\d{1,3})?)[ \t]*(?:tr|triệu|trieu|TR|TRIỆU|TRIEU)(?:[ \t]*(?:đ|vnđ|vnd|VND|Đ|VNĐ))?(?=(?:[ \t]*\/(?:tháng|th|t|phòng|căn|p|người|ng|năm)|[ \t]*[-–—][ \t]*[pP]?\d+|[ \t]*(?:\n|$|[,\.;\)\}\]\+\*☘\s])))",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase,
        DefaultRegexTimeout
    );

    // 3. Dạng hàng nghìn k (chỉ áp dụng từ 1.000k trở lên): 4000k, 4.000k, 4,000k, 4600k, 4.600k, 4650k, 12500k
    private static readonly Regex ThousandKRegex = new(
        @"(?<![\d\w\.\,\/])([1-9]\d{0,2}(?:[\.\,]\d{3})|[1-9]\d{3,5})[ \t]*(?:k|K)(?:[ \t]*(?:đ|vnđ|vnd|VND|Đ|VNĐ))?(?=(?:[ \t]*\/(?:tháng|th|t|phòng|căn|p|người|ng|năm)|[ \t]*[-–—][ \t]*[pP]?\d+|[ \t]*(?:\n|$|[,\.;\)\}\]\+\*☘\s])))",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase,
        DefaultRegexTimeout
    );

    // 4. Dạng đã rút gọn nhưng còn số 0 thừa ở đuôi: 4tr000 -> 4tr, 4tr600 -> 4tr6, 4tr50 -> 4tr5
    private static readonly Regex CompactTrailingZerosRegex = new(
        @"(?<![\d\w])([1-9]\d{0,2})tr(\d+)(?![\d\w])",
        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase,
        DefaultRegexTimeout
    );

    /// <summary>
    /// Chuẩn hóa toàn bộ các định dạng giá tiền trong văn bản sang định dạng chuẩn gọn XtrY (VD: 4tr, 4tr6, 4tr65)
    /// </summary>
    /// <param name="text">Văn bản đầu vào</param>
    /// <returns>Văn bản với giá tiền đã được chuẩn hóa</returns>
    public static string NormalizePrices(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return text ?? string.Empty;

        // 1. Chuyển đổi dạng số triệu đầy đủ (4.000.000, 4.600.000, 4600000...)
        string result = FullMillionRegex.Replace(text, match =>
        {
            string rawDigits = match.Groups[1].Value.Replace(".", "").Replace(",", "");
            if (long.TryParse(rawDigits, NumberStyles.Integer, CultureInfo.InvariantCulture, out long amount))
            {
                // Kiểm tra loại trừ số điện thoại (10 chữ số bắt đầu bằng 0) hoặc số quá lớn không thực tế
                if (amount >= 500_000 && amount <= 500_000_000)
                {
                    return FormatMillionAmount(amount);
                }
            }
            return match.Value;
        });

        // 2. Chuyển đổi dạng thập phân có đơn vị tr/triệu (4.6 tr, 4.6 triệu, 4 tr...)
        result = DecimalMillionRegex.Replace(result, match =>
        {
            string numberPart = match.Groups[1].Value.Replace(',', '.');
            if (decimal.TryParse(numberPart, NumberStyles.Float, CultureInfo.InvariantCulture, out decimal millions))
            {
                if (millions >= 0.5m && millions <= 500m)
                {
                    return FormatDecimalMillions(millions);
                }
            }
            return match.Value;
        });

        // 3. Chuyển đổi dạng nghìn k >= 1000k (4000k, 4600k, 4.600k...)
        result = ThousandKRegex.Replace(result, match =>
        {
            string rawDigits = match.Groups[1].Value.Replace(".", "").Replace(",", "");
            if (long.TryParse(rawDigits, NumberStyles.Integer, CultureInfo.InvariantCulture, out long thousandK))
            {
                if (thousandK >= 1_000 && thousandK <= 500_000)
                {
                    long amount = thousandK * 1_000;
                    return FormatMillionAmount(amount);
                }
            }
            return match.Value;
        });

        // 4. Dọn dẹp số 0 thừa trong các dạng 4tr000, 4tr600, 4tr50
        result = CompactTrailingZerosRegex.Replace(result, match =>
        {
            string prefix = match.Groups[1].Value;
            string suffix = match.Groups[2].Value;

            // Xóa các số 0 ở cuối
            string trimmedSuffix = suffix.TrimEnd('0');
            if (string.IsNullOrEmpty(trimmedSuffix))
            {
                return $"{prefix}tr";
            }
            return $"{prefix}tr{trimmedSuffix}";
        });

        return result;
    }

    /// <summary>
    /// Chuyển đổi số tiền nguyên (VND) sang định dạng XtrY (VD: 4000000 -> 4tr, 4600000 -> 4tr6, 4650000 -> 4tr65)
    /// </summary>
    public static string FormatMillionAmount(long amountInVnd)
    {
        if (amountInVnd < 1_000_000)
        {
            long k = amountInVnd / 1_000;
            return $"{k}k";
        }

        decimal millions = (decimal)amountInVnd / 1_000_000m;
        return FormatDecimalMillions(millions);
    }

    /// <summary>
    /// Chuyển đổi số thập phân triệu sang định dạng XtrY (VD: 4.0 -> 4tr, 4.6 -> 4tr6, 4.65 -> 4tr65, 4.05 -> 4tr05)
    /// </summary>
    public static string FormatDecimalMillions(decimal millions)
    {
        long integerPart = (long)Math.Truncate(millions);
        decimal fractional = millions - integerPart;

        if (fractional == 0)
        {
            return $"{integerPart}tr";
        }

        // Bỏ "0." và loại bỏ số 0 thừa ở đuôi
        string fracStr = fractional.ToString("0.###", CultureInfo.InvariantCulture);
        if (fracStr.StartsWith("0."))
        {
            fracStr = fracStr.Substring(2).TrimEnd('0');
        }

        if (string.IsNullOrEmpty(fracStr))
        {
            return $"{integerPart}tr";
        }

        return $"{integerPart}tr{fracStr}";
    }
}
