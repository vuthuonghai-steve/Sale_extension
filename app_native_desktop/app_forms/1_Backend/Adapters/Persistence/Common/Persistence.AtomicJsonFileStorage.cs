using System.Text.Json;
using AppForms.Shared.Common;
using Microsoft.Extensions.Logging;

namespace AppForms.Backend.Adapters.Persistence.Common;

/// <summary>
/// Thực thi lưu trữ file JSON an toàn cho mọi kiểu thực thể dữ liệu (Generic Atomic JSON Storage).
/// Tự động quản lý thư mục, nạp Seed Data dự phòng và ghi đè an toàn qua file tạm (.tmp).
/// </summary>
/// <typeparam name="T">Kiểu dữ liệu thực thể gốc cần lưu trữ</typeparam>
public class AtomicJsonFileStorage<T> : IJsonFileStorage<T> where T : class, new()
{
    private readonly ILogger _logger;
    private readonly string _runtimeFilePath;
    private readonly object _lock = new();

    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = true
    };

    public string FilePath => _runtimeFilePath;

    public AtomicJsonFileStorage(
        ILogger logger,
        string defaultFileName,
        string? customFilePath = null)
    {
        _logger = logger;

        if (!string.IsNullOrWhiteSpace(customFilePath))
        {
            _runtimeFilePath = customFilePath;
            var dir = Path.GetDirectoryName(_runtimeFilePath);
            if (!string.IsNullOrEmpty(dir))
            {
                Directory.CreateDirectory(dir);
            }
        }
        else
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            var dir = Path.Combine(appData, "SaleLeadFormConverter");
            Directory.CreateDirectory(dir);
            _runtimeFilePath = Path.Combine(dir, defaultFileName);
        }
    }

    public Result<T> Load(string seedFileName, Func<T>? defaultFactory = null)
    {
        lock (_lock)
        {
            try
            {
                // 1. Nạp từ Runtime Data nếu file tồn tại
                if (File.Exists(_runtimeFilePath))
                {
                    _logger.LogInformation("Nạp dữ liệu từ Runtime File: {Path}", _runtimeFilePath);
                    var content = File.ReadAllText(_runtimeFilePath);
                    if (TryParse(content, out var runtimeData) && runtimeData != null)
                    {
                        return Result<T>.Success(runtimeData);
                    }
                }

                // 2. Fallback nạp từ Seed Data mẫu
                var seedPath = FindSeedFilePath(seedFileName);
                if (seedPath != null && File.Exists(seedPath))
                {
                    _logger.LogInformation("Nạp dữ liệu từ Seed Data: {Path}", seedPath);
                    var content = File.ReadAllText(seedPath);
                    if (TryParse(content, out var seedData) && seedData != null)
                    {
                        Save(seedData);
                        return Result<T>.Success(seedData);
                    }
                }

                // 3. Fallback khởi tạo mặc định nếu có defaultFactory
                if (defaultFactory != null)
                {
                    _logger.LogWarning("Không tìm thấy dữ liệu cho {FileName}. Sử dụng Default Factory.", seedFileName);
                    var fallbackData = defaultFactory();
                    Save(fallbackData);
                    return Result<T>.Success(fallbackData);
                }

                var emptyData = new T();
                return Result<T>.Success(emptyData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi nạp file JSON từ {Path}", _runtimeFilePath);
                return Result<T>.Failure($"Lỗi nạp file: {ex.Message}");
            }
        }
    }

    public Result Save(T data)
    {
        lock (_lock)
        {
            try
            {
                var json = JsonSerializer.Serialize(data, SerializerOptions);
                var tempPath = _runtimeFilePath + "." + Guid.NewGuid().ToString("N") + ".tmp";

                File.WriteAllText(tempPath, json);

                if (File.Exists(_runtimeFilePath))
                {
                    File.Copy(tempPath, _runtimeFilePath, overwrite: true);
                    try { File.Delete(tempPath); } catch { }
                }
                else
                {
                    File.Move(tempPath, _runtimeFilePath, overwrite: true);
                }

                _logger.LogInformation("Lưu dữ liệu an toàn thành công tại {Path}", _runtimeFilePath);
                return Result.Success();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lưu dữ liệu an toàn vào {Path}", _runtimeFilePath);
                return Result.Failure($"Lỗi lưu dữ liệu: {ex.Message}");
            }
        }
    }

    private bool TryParse(string json, out T? result)
    {
        try
        {
            result = JsonSerializer.Deserialize<T>(json, SerializerOptions);
            return result != null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Không thể deserialize dữ liệu JSON");
            result = null;
            return false;
        }
    }

    private static string? FindSeedFilePath(string seedFileName)
    {
        var candidates = new[]
        {
            Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "0_Shared", "Data", seedFileName),
            Path.Combine(Directory.GetCurrentDirectory(), "0_Shared", "Data", seedFileName),
            Path.Combine(AppDomain.CurrentDomain.BaseDirectory, seedFileName),
            Path.Combine(Directory.GetCurrentDirectory(), seedFileName)
        };

        return candidates.FirstOrDefault(File.Exists);
    }
}
