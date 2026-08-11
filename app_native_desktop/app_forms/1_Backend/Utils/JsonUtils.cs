using System.Text.Json;
using AppForms.Shared.Common;

namespace AppForms.Backend.Utils;

public static class JsonUtils
{
    private static readonly JsonSerializerOptions PrettyOptions = new()
    {
        WriteIndented = true
    };

    public static Result<string> FormatJson(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return Result<string>.Failure("Nội dung rỗng");

        try
        {
            using var doc = JsonDocument.Parse(json);
            var formatted = JsonSerializer.Serialize(doc.RootElement, PrettyOptions);
            return Result<string>.Success(formatted);
        }
        catch (JsonException ex)
        {
            return Result<string>.Failure($"JSON không hợp lệ: {ex.Message}");
        }
    }

    public static Result<T> Deserialize<T>(string json)
    {
        try
        {
            var obj = JsonSerializer.Deserialize<T>(json);
            return obj != null
                ? Result<T>.Success(obj)
                : Result<T>.Failure("Dữ liệu deserialize trả về null");
        }
        catch (Exception ex)
        {
            return Result<T>.Failure($"Lỗi deserialize: {ex.Message}");
        }
    }

    public static string Serialize<T>(T obj, bool indented = false)
    {
        return JsonSerializer.Serialize(obj, indented ? PrettyOptions : null);
    }
}
