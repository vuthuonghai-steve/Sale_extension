using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Interfaces;

namespace AppForms.Backend.Services;

public class MessageParserService : IMessageParser
{
    private readonly ITextSanitizer _sanitizer;

    public MessageParserService(ITextSanitizer sanitizer)
    {
        _sanitizer = sanitizer;
    }

    public LeadEntity Parse(string rawText)
    {
        if (string.IsNullOrWhiteSpace(rawText))
        {
            return new LeadEntity();
        }

        var cleanedText = _sanitizer.RemoveHiddenChars(rawText);
        var rawLines = cleanedText
            .Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.RemoveEmptyEntries)
            .Select(l => l.Trim())
            .Where(l => l.Length > 0)
            .ToList();

        string? teamName = null;
        string? customerName = null;
        string? customerPhone = null;
        string? address = null;
        string? viewTime = null;
        string? price = null;
        string? roomCode = null;
        string? salesName = null;
        var unparsedNotes = new List<string>();

        // 1. Kiểm tra dòng đầu tiên xem có phải tên Team/Group không
        if (rawLines.Count > 0)
        {
            var firstLine = rawLines[0];
            var normFirst = NormalizeLabel(firstLine);
            if (normFirst.Contains("team") || normFirst.Contains("group") ||
                normFirst.Contains("home") || normFirst.Contains("house"))
            {
                teamName = firstLine;
            }
        }

        foreach (var rawLine in rawLines)
        {
            if (rawLine == teamName) continue;

            // Tách Key - Value qua dấu hai chấm ':' hoặc '：'
            var colonIndex = rawLine.IndexOfAny(new[] { ':', '：' });
            if (colonIndex != -1)
            {
                var rawKey = rawLine[..colonIndex];
                var rawVal = rawLine[(colonIndex + 1)..];

                var cleanVal = _sanitizer.RemoveHiddenChars(rawVal).Trim();
                var normKey = NormalizeLabel(rawKey);

                if (IsCustomerSocialLabel(normKey))
                {
                    customerName = cleanVal;
                    continue;
                }

                if (IsPhoneLabel(normKey))
                {
                    customerPhone = ExtractPhoneNumber(cleanVal) ?? cleanVal;
                    continue;
                }

                if (IsAddressLabel(normKey))
                {
                    address = cleanVal;
                    continue;
                }

                if (IsViewTimeLabel(normKey))
                {
                    viewTime = cleanVal;
                    continue;
                }

                if (IsPriceLabel(normKey))
                {
                    price = cleanVal;
                    continue;
                }

                if (IsRoomCodeLabel(normKey))
                {
                    roomCode = cleanVal;
                    continue;
                }

                if (IsSalesLabel(normKey))
                {
                    salesName = cleanVal;
                    continue;
                }
            }

            // Heuristic fallback
            var normLine = NormalizeLabel(rawLine);

            if (customerPhone == null)
            {
                var phone = ExtractPhoneNumber(rawLine);
                if (phone != null && (normLine.Contains("sdt") || normLine.Contains("phone") || normLine.StartsWith(phone)))
                {
                    customerPhone = phone;
                    continue;
                }
            }

            // Check mã phòng / mã nguồn / mã hàng (ví dụ: Mn35, Mn 35, Ts007, Ts 007, NT023, NT 023, 95_01)
            var roomMatch = Regex.Match(rawLine, @"(?:mã\s*(?:phòng|nguồn|hàng|tòa)?|ma\s*(?:phong|nguon|hang|toa)?)\s*[:：]?\s*([a-zA-Z0-9]+(?:\s+[a-zA-Z0-9]+)?|[a-zA-Z0-9\-_]+)", RegexOptions.IgnoreCase);
            if (roomCode == null && roomMatch.Success)
            {
                var candidate = roomMatch.Groups[1].Value.Trim();
                // Bỏ qua nếu candidate là những từ chung chung không phải mã
                if (!string.Equals(candidate, "phong", StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(candidate, "nguon", StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(candidate, "hang", StringComparison.OrdinalIgnoreCase))
                {
                    roomCode = candidate;
                    continue;
                }
            }

            // Check standalone brand codes (Mn35, Mn 35, Ts007, Ts 007, NT023, NT 023, 95_01, TL21...) đứng đầu dòng hoặc nguyên dòng
            var brandCodeMatch = Regex.Match(rawLine, @"^\s*(?:👉|👉🏻|✨|☘️|🔥|⭐|📔|🫶🏻|[-•*])?\s*(mn\s*\d+[a-zA-Z0-9]*|ts\s*\d+[a-zA-Z0-9]*|nt\s*\d+[a-zA-Z0-9]*|95[_\-\s]\d+[a-zA-Z0-9]*|tl\s*\d+[a-zA-Z0-9\-_]*)\b", RegexOptions.IgnoreCase);
            if (roomCode == null && brandCodeMatch.Success)
            {
                roomCode = brandCodeMatch.Groups[1].Value.Trim();
                continue;
            }

            // Check sales name
            var salesMatch = Regex.Match(rawLine, @"(?:tên\s*sales|tên\s*ctv|ctv|sales|sale)\s*[:：]?\s*(.+)", RegexOptions.IgnoreCase);
            if (salesName == null && salesMatch.Success)
            {
                salesName = salesMatch.Groups[1].Value.Trim();
                continue;
            }

            unparsedNotes.Add(rawLine);
        }

        // Nếu customerName chứa SĐT và customerPhone chưa có
        if (customerPhone == null && customerName != null)
        {
            var phoneInName = ExtractPhoneNumber(customerName);
            if (phoneInName != null)
            {
                customerPhone = phoneInName;
            }
        }

        return new LeadEntity
        {
            TeamName = teamName,
            CustomerName = customerName,
            CustomerPhone = customerPhone,
            Address = address,
            ViewTime = viewTime,
            Price = price,
            RoomCode = roomCode,
            SalesName = salesName,
            RawNotes = unparsedNotes.Count > 0 ? string.Join(Environment.NewLine, unparsedNotes) : null
        };
    }

    public string? ExtractPhoneNumber(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;
        var match = Regex.Match(text, @"(?:(?:\+84|84|0)[3|5|7|8|9][0-9]{8})\b");
        return match.Success ? match.Value : null;
    }

    private static string RemoveAccents(string str)
    {
        if (string.IsNullOrEmpty(str)) return string.Empty;
        var normalized = str.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var c in normalized)
        {
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }
        return sb.ToString().Normalize(NormalizationForm.FormC).Replace("đ", "d").Replace("Đ", "D");
    }

    private string NormalizeLabel(string label)
    {
        var unaccented = RemoveAccents(_sanitizer.RemoveHiddenChars(label));
        return Regex.Replace(unaccented.ToLowerInvariant(), @"[^a-z0-9]", "").Trim();
    }

    private static bool IsCustomerSocialLabel(string key)
    {
        return key.Contains("fbzalo") || key.Contains("fb") || key.Contains("zalo") ||
               key.Contains("tenkh") || key.Contains("khachhang") || key == "khach" ||
               key.Contains("tenkhfbzalo") || key.Contains("facebook");
    }

    private static bool IsPhoneLabel(string key)
    {
        return key.Contains("sdt") || key.Contains("phone") || key.Contains("tel") ||
               key.Contains("didong") || key.Contains("sdtkhach") || key.Contains("sokhach") ||
               key.Contains("sodienthoai");
    }

    private static bool IsAddressLabel(string key)
    {
        return key.Contains("diachi") || key.Contains("dc") || key.Contains("vitri") ||
               key.Contains("diachiphong");
    }

    private static bool IsViewTimeLabel(string key)
    {
        return key.Contains("ngaygio") || key.Contains("thoigian") || key.Contains("ngayxem") ||
               key.Contains("gioxem") || key.Contains("xemphong") || key.Contains("henxem") ||
               key.Contains("thoigianxem") || key.Contains("ngaygioxem") || key.Contains("thoigiankhachdixem");
    }

    private static bool IsPriceLabel(string key)
    {
        return key.Contains("gia") || key.Contains("giaphong") || key.Contains("giatuvan") ||
               key.Contains("price") || key.Contains("ngan") || key.Contains("trieu");
    }

    private static bool IsRoomCodeLabel(string key)
    {
        return key.Contains("maphong") || key.Contains("matoa") || key.Contains("phong") ||
               key.Contains("room") || key.Contains("toa") || key == "ma" ||
               key.Contains("manguon") || key.Contains("mahang");
    }

    private static bool IsSalesLabel(string key)
    {
        return key.Contains("ctv") || key.Contains("sales") || key.Contains("sale") ||
               key.Contains("tensales") || key.Contains("tenctv") || key.Contains("nguoituvan");
    }
}
