using System.Collections.Concurrent;
using System.Text.Json;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Shared.Common;
using AppForms.Shared.Models.SpecialMapping;
using Microsoft.Extensions.Logging;

namespace AppForms.Backend.Services;

/// <summary>
/// Quản lý nạp, ghi Atomic File JSON và lưu trữ Cache O(1) tra cứu trong RAM.
/// Việc bóc tách Regex và chuẩn hóa token được ủy quyền cho ISpecialMappingTextParser.
/// </summary>
public class JsonSpecialRoomMappingRepository : ISpecialRoomMappingRepository
{
    private readonly ILogger<JsonSpecialRoomMappingRepository> _logger;
    private readonly ISpecialMappingTextParser _textParser;
    private readonly string _runtimeFilePath;
    private readonly object _lock = new();

    private readonly ConcurrentDictionary<string, SpecialRoomMappingEntity> _codeIndex = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<string, SpecialRoomMappingEntity> _phoneIndex = new(StringComparer.OrdinalIgnoreCase);
    private readonly List<SpecialRoomMappingEntity> _items = new();
    private int _version = 1;
    private string _description = "Kho lưu trữ mã phòng đặc biệt và bảng đối chiếu chéo đa sàn";

    public JsonSpecialRoomMappingRepository(
        ILogger<JsonSpecialRoomMappingRepository> logger,
        ISpecialMappingTextParser textParser,
        string? customFilePath = null)
    {
        _logger = logger;
        _textParser = textParser;

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
            _runtimeFilePath = Path.Combine(dir, "special_room_mappings.json");
        }

        LoadInitialData();
    }

    public JsonSpecialRoomMappingRepository(
        ILogger<JsonSpecialRoomMappingRepository> logger,
        string? customFilePath = null)
        : this(logger, new SpecialMappingTextParser(), customFilePath)
    {
    }

    private void LoadInitialData()
    {
        lock (_lock)
        {
            try
            {
                if (File.Exists(_runtimeFilePath))
                {
                    _logger.LogInformation("Nạp kho mã đặc biệt từ Runtime Data: {Path}", _runtimeFilePath);
                    var content = File.ReadAllText(_runtimeFilePath);
                    if (TryParseAndPopulate(content))
                    {
                        return;
                    }
                }

                // Fallback nạp từ Seed Data
                var seedPath = FindSeedFilePath();
                if (seedPath != null && File.Exists(seedPath))
                {
                    _logger.LogInformation("Nạp kho mã đặc biệt từ Seed Data: {Path}", seedPath);
                    var content = File.ReadAllText(seedPath);
                    if (TryParseAndPopulate(content))
                    {
                        Save();
                        return;
                    }
                }

                _logger.LogWarning("Không tìm thấy file special_room_mappings.json. Khởi tạo danh mục rỗng.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi nạp dữ liệu kho mã đặc biệt");
            }
        }
    }

    private static string? FindSeedFilePath()
    {
        var candidates = new[]
        {
            Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "0_Shared", "Data", "special_room_mappings.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "0_Shared", "Data", "special_room_mappings.json"),
            Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "special_room_mappings.json")
        };

        return candidates.FirstOrDefault(File.Exists);
    }

    private bool TryParseAndPopulate(string json)
    {
        try
        {
            var registry = JsonSerializer.Deserialize<SpecialRoomMappingRegistryEntity>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (registry?.Items != null)
            {
                _version = registry.Version;
                _description = registry.Description;
                _items.Clear();
                _items.AddRange(registry.Items);

                RebuildLookupCache();
                return true;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Không thể deserialize file special_room_mappings.json");
        }

        return false;
    }

    private void RebuildLookupCache()
    {
        _codeIndex.Clear();
        _phoneIndex.Clear();

        foreach (var item in _items)
        {
            // Index số điện thoại
            if (!string.IsNullOrWhiteSpace(item.Phone))
            {
                var cleanPhone = _textParser.CleanPhone(item.Phone);
                if (!string.IsNullOrEmpty(cleanPhone))
                {
                    _phoneIndex[cleanPhone] = item;
                }
            }

            // Index các mã phòng
            var allCodesToRegister = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var code in item.MatchedCodes)
            {
                if (!string.IsNullOrWhiteSpace(code))
                {
                    allCodesToRegister.Add(code.Trim());
                }
            }

            foreach (var (_, codeVal) in item.PlatformCodes)
            {
                if (!string.IsNullOrWhiteSpace(codeVal))
                {
                    allCodesToRegister.Add(codeVal.Trim());
                }
            }

            if (!string.IsNullOrWhiteSpace(item.BuildingNo))
            {
                allCodesToRegister.Add(item.BuildingNo.Trim());
            }

            foreach (var rawCode in allCodesToRegister)
            {
                var clean = _textParser.CleanCode(rawCode);
                if (!string.IsNullOrEmpty(clean))
                {
                    _codeIndex[clean] = item;

                    var noHyphen = clean.Replace("-", "");
                    if (noHyphen != clean && !string.IsNullOrEmpty(noHyphen))
                    {
                        _codeIndex[noHyphen] = item;
                    }

                    var noLeadingZero = clean.TrimStart('0', '-');
                    if (!string.IsNullOrEmpty(noLeadingZero))
                    {
                        _codeIndex[noLeadingZero] = item;
                    }
                }
            }
        }
    }

    public SpecialRoomMappingEntity? FindMappingByCode(string roomCode)
    {
        if (string.IsNullOrWhiteSpace(roomCode)) return null;

        var clean = _textParser.CleanCode(roomCode);
        if (_codeIndex.TryGetValue(clean, out var item))
        {
            return item;
        }

        var noHyphen = clean.Replace("-", "");
        if (noHyphen != clean && _codeIndex.TryGetValue(noHyphen, out item))
        {
            return item;
        }

        var noLeadingZero = clean.TrimStart('0', '-');
        if (!string.IsNullOrEmpty(noLeadingZero) && _codeIndex.TryGetValue(noLeadingZero, out item))
        {
            return item;
        }

        return null;
    }

    public SpecialRoomMappingEntity? FindMappingByPhone(string phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return null;
        var clean = _textParser.CleanPhone(phone);
        return _phoneIndex.TryGetValue(clean, out var item) ? item : null;
    }

    public SpecialRoomMappingEntity? FindMappingByText(string text)
    {
        return _textParser.FindMappingInText(text, this);
    }

    public IReadOnlyList<SpecialRoomMappingEntity> GetAll()
    {
        lock (_lock)
        {
            return _items.ToList();
        }
    }

    public Result Reload()
    {
        LoadInitialData();
        return Result.Success();
    }

    public Result Save()
    {
        lock (_lock)
        {
            try
            {
                var registry = new SpecialRoomMappingRegistryEntity
                {
                    Version = _version,
                    LastUpdated = DateTime.UtcNow,
                    Description = _description,
                    Items = _items
                };

                var options = new JsonSerializerOptions
                {
                    WriteIndented = true
                };

                var json = JsonSerializer.Serialize(registry, options);
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

                _logger.LogInformation("Kho mã đặc biệt đã được lưu an toàn tại {Path}", _runtimeFilePath);
                return Result.Success();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lưu kho mã đặc biệt vào {Path}", _runtimeFilePath);
                return Result.Failure($"Lỗi lưu dữ liệu: {ex.Message}");
            }
        }
    }
}
