using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Contracts.Schemas;
using AppForms.Frontend.Screens.Settings.Models;

namespace AppForms.Frontend.Screens.Settings.Hooks;

/// <summary>
/// State Controller / Hook quản lý trạng thái và nghiệp vụ màn hình Cài đặt
/// </summary>
public class SettingsStateHook
{
    private readonly ISettingsService _settingsService;
    private readonly IRoomCodeRepository _roomCodeRepo;

    public string SelectedSchemaId { get; private set; } = "tl21_house";
    public List<RoomCodeGroupViewModel> AvailableGroups { get; private set; } = new();

    public event Action<SettingsFormModel>? GeneralSettingsLoaded;
    public event Action? GeneralSettingsSaved;
    public event Action<List<RoomCodeGroupViewModel>, string>? RoomGroupsReloaded;
    public event Action<RoomCodeGroupViewModel>? RoomCodesUpdated;
    public event Action<string, bool>? OperationFeedback;

    public SettingsStateHook(ISettingsService settingsService, IRoomCodeRepository roomCodeRepo)
    {
        _settingsService = settingsService;
        _roomCodeRepo = roomCodeRepo;
    }

    public void LoadGeneralSettings()
    {
        var cur = _settingsService.Current;
        var model = new SettingsFormModel
        {
            FixedCtvName = cur.FixedCtvName,
            AutoStartClipboardListening = cur.AutoStartClipboardListening,
            MinimizeToTrayOnClose = cur.MinimizeToTrayOnClose
        };
        GeneralSettingsLoaded?.Invoke(model);
    }

    public void SaveGeneralSettings(SettingsFormModel model)
    {
        var result = _settingsService.Update(s =>
        {
            s.FixedCtvName = model.FixedCtvName.Trim();
            s.AutoStartClipboardListening = model.AutoStartClipboardListening;
            s.MinimizeToTrayOnClose = model.MinimizeToTrayOnClose;
        });

        if (result.IsSuccess)
        {
            GeneralSettingsSaved?.Invoke();
            OperationFeedback?.Invoke("Đã lưu cài đặt chung thành công!", true);
        }
        else
        {
            OperationFeedback?.Invoke($"Lỗi lưu cài đặt: {result.Error}", false);
        }
    }

    public void LoadRoomCodes()
    {
        var defaultSchemas = DefaultSchemas.GetAllDefaultSchemas();
        var groups = new List<RoomCodeGroupViewModel>();

        foreach (var schema in defaultSchemas)
        {
            var codes = _roomCodeRepo.GetCodesBySchema(schema.Id).ToList();
            groups.Add(new RoomCodeGroupViewModel
            {
                SchemaId = schema.Id,
                DisplayName = schema.Name,
                Icon = schema.Icon,
                Codes = codes
            });
        }

        AvailableGroups = groups;

        // Đảm bảo SelectedSchemaId hợp lệ
        if (!AvailableGroups.Any(g => g.SchemaId.Equals(SelectedSchemaId, StringComparison.OrdinalIgnoreCase)))
        {
            SelectedSchemaId = AvailableGroups.FirstOrDefault()?.SchemaId ?? "tl21_house";
        }

        RoomGroupsReloaded?.Invoke(AvailableGroups, SelectedSchemaId);

        var currentGroup = AvailableGroups.FirstOrDefault(g => g.SchemaId.Equals(SelectedSchemaId, StringComparison.OrdinalIgnoreCase));
        if (currentGroup != null)
        {
            RoomCodesUpdated?.Invoke(currentGroup);
        }
    }

    public void SelectSchema(string schemaId)
    {
        if (string.IsNullOrWhiteSpace(schemaId)) return;

        SelectedSchemaId = schemaId;
        var currentGroup = AvailableGroups.FirstOrDefault(g => g.SchemaId.Equals(SelectedSchemaId, StringComparison.OrdinalIgnoreCase));
        if (currentGroup != null)
        {
            RoomCodesUpdated?.Invoke(currentGroup);
        }
    }

    public void AddCodes(string schemaId, string rawInput)
    {
        if (string.IsNullOrWhiteSpace(rawInput))
        {
            OperationFeedback?.Invoke("Vui lòng nhập mã phòng cần thêm.", false);
            return;
        }

        // Tách các mã theo dấu phẩy, chấm phẩy, xuống dòng hoặc khoảng trắng nếu nhiều mã
        var separators = new[] { ',', ';', '\r', '\n' };
        var codes = rawInput
            .Split(separators, StringSplitOptions.RemoveEmptyEntries)
            .Select(c => c.Trim())
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (codes.Count == 0)
        {
            OperationFeedback?.Invoke("Không tìm thấy mã hợp lệ trong nội dung nhập.", false);
            return;
        }

        var result = _roomCodeRepo.RegisterCodes(schemaId, codes);
        if (result.IsSuccess)
        {
            LoadRoomCodes();
            var groupName = _roomCodeRepo.GetGroupName(schemaId) ?? schemaId;
            OperationFeedback?.Invoke($"Đã thêm thành công {codes.Count} mã vào nhóm {groupName}!", true);
        }
        else
        {
            OperationFeedback?.Invoke($"Lỗi thêm mã: {result.Error}", false);
        }
    }

    public void RemoveCode(string schemaId, string code)
    {
        if (string.IsNullOrWhiteSpace(code)) return;

        var result = _roomCodeRepo.RemoveCodes(schemaId, new[] { code });
        if (result.IsSuccess)
        {
            LoadRoomCodes();
            OperationFeedback?.Invoke($"Đã xóa mã {code}!", true);
        }
        else
        {
            OperationFeedback?.Invoke($"Lỗi xóa mã: {result.Error}", false);
        }
    }
}
