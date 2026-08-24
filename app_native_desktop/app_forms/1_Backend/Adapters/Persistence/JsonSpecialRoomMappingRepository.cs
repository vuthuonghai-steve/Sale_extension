using System.Collections.Concurrent;
using AppForms.Backend.Adapters.Persistence.Common;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Shared.Common;
using AppForms.Shared.Models.SpecialMapping;
using Microsoft.Extensions.Logging;

namespace AppForms.Backend.Adapters.Persistence;

/// <summary>
/// Persistence Adapter quản lý nạp/ghi kho mã phòng đặc biệt đa sàn (special_room_mappings.json).
/// Duy trì bộ nhớ đệm tra cứu mã và số điện thoại O(1) trong RAM.
/// </summary>
public class JsonSpecialRoomMappingRepository : ISpecialRoomMappingRepository
{
    private readonly ILogger<JsonSpecialRoomMappingRepository> _logger;
    private readonly IJsonFileStorage<SpecialRoomMappingRegistryEntity> _storage;
    private readonly ISpecialMappingTextParser _textParser;
    private readonly object _lock = new();

    private readonly ConcurrentDictionary<string, SpecialRoomMappingEntity> _codeIndex = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<string, SpecialRoomMappingEntity> _phoneIndex = new(StringComparer.OrdinalIgnoreCase);
    private readonly List<SpecialRoomMappingEntity> _items = new();
    private int _version = 1;
    private string _description = "Kho lưu trữ mã phòng đặc biệt và bảng đối chiếu chéo đa sàn";

    public JsonSpecialRoomMappingRepository(
        ILogger<JsonSpecialRoomMappingRepository> logger,
        IJsonFileStorage<SpecialRoomMappingRegistryEntity> storage,
        ISpecialMappingTextParser textParser)
    {
        _logger = logger;
        _storage = storage;
        _textParser = textParser;
        LoadInitialData();
    }

    public JsonSpecialRoomMappingRepository(
        ILogger<JsonSpecialRoomMappingRepository> logger,
        ISpecialMappingTextParser textParser,
        string? customFilePath = null)
        : this(logger, new AtomicJsonFileStorage<SpecialRoomMappingRegistryEntity>(logger, "special_room_mappings.json", customFilePath), textParser)
    {
    }

    public JsonSpecialRoomMappingRepository(
        ILogger<JsonSpecialRoomMappingRepository> logger,
        string? customFilePath = null)
        : this(logger, new AppForms.Backend.Services.SpecialMappingTextParser(), customFilePath)
    {
    }

    private void LoadInitialData()
    {
        lock (_lock)
        {
            var result = _storage.Load("special_room_mappings.json");
            if (result.IsSuccess && result.Value != null)
            {
                _version = result.Value.Version;
                _description = result.Value.Description;
                _items.Clear();
                _items.AddRange(result.Value.Items);
                RebuildLookupCache();
            }
        }
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
            var registry = new SpecialRoomMappingRegistryEntity
            {
                Version = _version,
                LastUpdated = DateTime.UtcNow,
                Description = _description,
                Items = _items
            };

            return _storage.Save(registry);
        }
    }
}
