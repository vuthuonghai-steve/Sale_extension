using System.Collections.Concurrent;
using System.Text.Json;
using System.Text.RegularExpressions;
using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Contracts.Schemas;
using AppForms.Shared.Common;
using Microsoft.Extensions.Logging;

namespace AppForms.Backend.Services;

public class JsonRoomCodeRepository : IRoomCodeRepository
{
    private readonly ILogger<JsonRoomCodeRepository> _logger;
    private readonly string _runtimeFilePath;
    private readonly object _lock = new();

    private readonly ConcurrentDictionary<string, List<string>> _cleanedCodeToSchema = new(StringComparer.OrdinalIgnoreCase);
    private Dictionary<string, RoomGroupEntity> _groups = new(StringComparer.OrdinalIgnoreCase);
    private int _version = 1;
    private string _description = "Kho lưu trữ mã phòng cho các Form Schema Output";

    public JsonRoomCodeRepository(ILogger<JsonRoomCodeRepository> logger, string? customFilePath = null)
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
            _runtimeFilePath = Path.Combine(dir, "room_codes.json");
        }

        LoadInitialData();
    }

    private void LoadInitialData()
    {
        lock (_lock)
        {
            try
            {
                if (File.Exists(_runtimeFilePath))
                {
                    _logger.LogInformation("Nạp kho mã phòng từ Runtime Data: {Path}", _runtimeFilePath);
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
                    _logger.LogInformation("Nạp kho mã phòng từ Seed Data: {Path}", seedPath);
                    var content = File.ReadAllText(seedPath);
                    if (TryParseAndPopulate(content))
                    {
                        // Lưu ngay bản sao sang Runtime Data để sử dụng
                        Save();
                        return;
                    }
                }

                // Fallback khởi tạo mặc định nếu không tìm thấy file nào
                _logger.LogWarning("Không tìm thấy file room_codes.json. Khởi tạo danh mục mặc định.");
                InitializeDefaultGroups();
                Save();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi nạp dữ liệu kho mã phòng");
                InitializeDefaultGroups();
            }
        }
    }

    private static string? FindSeedFilePath()
    {
        var candidates = new[]
        {
            Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "0_Shared", "Data", "room_codes.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "0_Shared", "Data", "room_codes.json"),
            Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "room_codes.json")
        };

        return candidates.FirstOrDefault(File.Exists);
    }

    private bool TryParseAndPopulate(string json)
    {
        try
        {
            var registry = JsonSerializer.Deserialize<RoomCodeRegistryEntity>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (registry?.Groups != null && registry.Groups.Count > 0)
            {
                _version = registry.Version;
                _description = registry.Description;
                _groups = new Dictionary<string, RoomGroupEntity>(registry.Groups, StringComparer.OrdinalIgnoreCase);

                RebuildLookupCache();
                return true;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Không thể deserialize file room_codes.json");
        }

        return false;
    }

    private void InitializeDefaultGroups()
    {
        _groups.Clear();
        foreach (var schema in DefaultSchemas.GetAllDefaultSchemas())
        {
            _groups[schema.Id] = new RoomGroupEntity
            {
                Name = schema.Name,
                Codes = new List<string>()
            };
        }
        RebuildLookupCache();
    }

    private void RebuildLookupCache()
    {
        _cleanedCodeToSchema.Clear();
        foreach (var (schemaId, group) in _groups)
        {
            foreach (var code in group.Codes)
            {
                var clean = CleanCode(code);
                if (!string.IsNullOrEmpty(clean))
                {
                    AddCodeMapping(clean, schemaId);

                    // Thêm biến thể loại bỏ dấu gạch ngang (ví dụ: MN-324 -> MN324)
                    var noHyphen = clean.Replace("-", "");
                    if (noHyphen != clean && !string.IsNullOrEmpty(noHyphen))
                    {
                        AddCodeMapping(noHyphen, schemaId);
                    }
                }
            }
        }
    }

    private void AddCodeMapping(string cleanCode, string schemaId)
    {
        _cleanedCodeToSchema.AddOrUpdate(
            cleanCode,
            _ => new List<string> { schemaId },
            (_, list) =>
            {
                lock (list)
                {
                    if (!list.Contains(schemaId, StringComparer.OrdinalIgnoreCase))
                    {
                        list.Add(schemaId);
                    }
                }
                return list;
            });
    }

    public string? GetSchemaIdByCode(string roomCode)
    {
        var schemas = GetSchemaIdsByCode(roomCode);
        return schemas.Count == 1 ? schemas[0] : null;
    }

    public IReadOnlyList<string> GetSchemaIdsByCode(string roomCode)
    {
        if (string.IsNullOrWhiteSpace(roomCode)) return Array.Empty<string>();

        var clean = CleanCode(roomCode);
        if (_cleanedCodeToSchema.TryGetValue(clean, out var list))
        {
            lock (list)
            {
                return list.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            }
        }

        var noHyphen = clean.Replace("-", "");
        if (noHyphen != clean && _cleanedCodeToSchema.TryGetValue(noHyphen, out var noHyphenList))
        {
            lock (noHyphenList)
            {
                return noHyphenList.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            }
        }

        return Array.Empty<string>();
    }

    public bool HasDuplicateCode(string roomCode)
    {
        return GetSchemaIdsByCode(roomCode).Count > 1;
    }

    public IReadOnlyList<string> GetCodesBySchema(string schemaId)
    {
        lock (_lock)
        {
            if (_groups.TryGetValue(schemaId, out var group))
            {
                return group.Codes.ToList();
            }
            return Array.Empty<string>();
        }
    }

    public IReadOnlyDictionary<string, List<string>> GetAllGroupCodes()
    {
        lock (_lock)
        {
            var result = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
            foreach (var (key, value) in _groups)
            {
                result[key] = value.Codes.ToList();
            }
            return result;
        }
    }

    public string? GetGroupName(string schemaId)
    {
        lock (_lock)
        {
            if (_groups.TryGetValue(schemaId, out var group))
            {
                return group.Name;
            }
            return null;
        }
    }

    public Result RegisterCodes(string schemaId, IEnumerable<string> roomCodes)
    {
        if (string.IsNullOrWhiteSpace(schemaId))
        {
            return Result.Failure("Schema ID không hợp lệ.");
        }

        var codesToAdd = roomCodes
            .Select(c => c.Trim())
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (codesToAdd.Count == 0)
        {
            return Result.Failure("Danh sách mã cần thêm rỗng.");
        }

        lock (_lock)
        {
            if (!_groups.TryGetValue(schemaId, out var group))
            {
                var schema = DefaultSchemas.GetAllDefaultSchemas().FirstOrDefault(s => s.Id.Equals(schemaId, StringComparison.OrdinalIgnoreCase));
                group = new RoomGroupEntity
                {
                    Name = schema?.Name ?? schemaId,
                    Codes = new List<string>()
                };
                _groups[schemaId] = group;
            }

            int addedCount = 0;
            foreach (var code in codesToAdd)
            {
                if (!group.Codes.Any(existing => existing.Equals(code, StringComparison.OrdinalIgnoreCase)))
                {
                    group.Codes.Add(code);
                    addedCount++;
                }

                var clean = CleanCode(code);
                AddCodeMapping(clean, schemaId);
                var noHyphen = clean.Replace("-", "");
                if (noHyphen != clean && !string.IsNullOrEmpty(noHyphen))
                {
                    AddCodeMapping(noHyphen, schemaId);
                }
            }

            _logger.LogInformation("Đã thêm {Count} mã mới vào nhóm {SchemaId}", addedCount, schemaId);
            return Save();
        }
    }

    public Result RemoveCodes(string schemaId, IEnumerable<string> roomCodes)
    {
        if (string.IsNullOrWhiteSpace(schemaId))
        {
            return Result.Failure("Schema ID không hợp lệ.");
        }

        var codesToRemove = roomCodes
            .Select(c => c.Trim())
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (codesToRemove.Count == 0)
        {
            return Result.Success();
        }

        lock (_lock)
        {
            if (!_groups.TryGetValue(schemaId, out var group))
            {
                return Result.Success();
            }

            group.Codes.RemoveAll(c => codesToRemove.Contains(c));
            RebuildLookupCache();

            _logger.LogInformation("Đã xóa các mã khỏi nhóm {SchemaId}", schemaId);
            return Save();
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
                var registry = new RoomCodeRegistryEntity
                {
                    Version = _version,
                    LastUpdated = DateTime.UtcNow,
                    Description = _description,
                    Groups = _groups
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

                _logger.LogInformation("Kho mã phòng đã được lưu an toàn tại {Path}", _runtimeFilePath);
                return Result.Success();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lưu kho mã phòng vào {Path}", _runtimeFilePath);
                return Result.Failure($"Lỗi lưu dữ liệu: {ex.Message}");
            }
        }
    }

    private static string CleanCode(string code)
    {
        return Regex.Replace(code.Trim(), @"\s+", "");
    }
}
