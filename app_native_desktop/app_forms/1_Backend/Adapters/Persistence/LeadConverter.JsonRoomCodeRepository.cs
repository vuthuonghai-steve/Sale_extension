using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using AppForms.Backend.Adapters.Persistence.Common;
using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Contracts.Schemas;
using AppForms.Shared.Common;
using Microsoft.Extensions.Logging;

namespace AppForms.Backend.Adapters.Persistence;

/// <summary>
/// Persistence Adapter quản lý dữ liệu danh mục mã phòng (room_codes.json).
/// Duy trì bộ nhớ đệm đa nhánh (1-N Mapping Cache) trong RAM O(1).
/// </summary>
public class JsonRoomCodeRepository : IRoomCodeRepository
{
    private readonly ILogger<JsonRoomCodeRepository> _logger;
    private readonly IJsonFileStorage<RoomCodeRegistryEntity> _storage;
    private readonly object _lock = new();

    private readonly ConcurrentDictionary<string, List<string>> _cleanedCodeToSchema = new(StringComparer.OrdinalIgnoreCase);
    private Dictionary<string, RoomGroupEntity> _groups = new(StringComparer.OrdinalIgnoreCase);
    private int _version = 1;
    private string _description = "Kho lưu trữ mã phòng cho các Form Schema Output";

    public JsonRoomCodeRepository(
        ILogger<JsonRoomCodeRepository> logger,
        IJsonFileStorage<RoomCodeRegistryEntity> storage)
    {
        _logger = logger;
        _storage = storage;
        LoadInitialData();
    }

    public JsonRoomCodeRepository(
        ILogger<JsonRoomCodeRepository> logger,
        string? customFilePath = null)
        : this(logger, new AtomicJsonFileStorage<RoomCodeRegistryEntity>(logger, "room_codes.json", customFilePath))
    {
    }

    private void LoadInitialData()
    {
        lock (_lock)
        {
            var result = _storage.Load("room_codes.json", CreateDefaultRegistry);
            if (result.IsSuccess && result.Value != null)
            {
                _version = result.Value.Version;
                _description = result.Value.Description;
                _groups = new Dictionary<string, RoomGroupEntity>(result.Value.Groups, StringComparer.OrdinalIgnoreCase);
                RebuildLookupCache();
            }
        }
    }

    private static RoomCodeRegistryEntity CreateDefaultRegistry()
    {
        var groups = new Dictionary<string, RoomGroupEntity>(StringComparer.OrdinalIgnoreCase);
        foreach (var schema in DefaultSchemas.GetAllDefaultSchemas())
        {
            groups[schema.Id] = new RoomGroupEntity
            {
                Name = schema.Name,
                Codes = new List<string>()
            };
        }

        return new RoomCodeRegistryEntity
        {
            Version = 1,
            LastUpdated = DateTime.UtcNow,
            Description = "Kho lưu trữ mã phòng cho các Form Schema Output",
            Groups = groups
        };
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
            var registry = new RoomCodeRegistryEntity
            {
                Version = _version,
                LastUpdated = DateTime.UtcNow,
                Description = _description,
                Groups = _groups
            };

            return _storage.Save(registry);
        }
    }

    private static string CleanCode(string code)
    {
        return Regex.Replace(code.Trim(), @"\s+", "");
    }
}
