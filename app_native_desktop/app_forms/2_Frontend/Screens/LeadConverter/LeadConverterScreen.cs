using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Frontend.Screens.LeadConverter.Components;
using AppForms.Frontend.Screens.LeadConverter.Hooks;
using AppForms.Frontend.Shared.Components;
using AppForms.Frontend.Shared.Hooks;
using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Screens.LeadConverter;

public class LeadConverterScreen : UserControl
{
    private readonly IFormConverterService _converterService;
    private readonly ISchemaManager _schemaManager;
    private readonly IRoomCodeRepository _roomCodeRepo;
    private readonly LeadConverterStateHook _stateHook;

    private SchemaSelectorTabs _tabs = null!;
    private RawInputBox _rawInputBox = null!;
    private SpecialCodeAlertBox _specialAlertBox = null!;
    private LeadFieldEditor _fieldEditor = null!;
    private OutputPreviewBox _previewBox = null!;
    private RecentHistoryBox _historyBox = null!;
    private bool _isInternalSync;

    public event Action<string>? StatusMessageUpdated;

    public LeadConverterScreen(
        IFormConverterService converterService,
        ISchemaManager schemaManager,
        ISettingsService settingsService,
        ITemplateEngine templateEngine,
        ISchemaDetector schemaDetector,
        IRoomCodeRepository roomCodeRepo,
        ISpecialRoomMappingDetector? specialDetector = null,
        IClipboardAdapter? clipboardAdapter = null,
        ISystemLauncherAdapter? launcherAdapter = null)
    {
        _converterService = converterService;
        _schemaManager = schemaManager;
        _roomCodeRepo = roomCodeRepo;
        _stateHook = new LeadConverterStateHook(converterService, schemaManager, templateEngine, settingsService, schemaDetector, roomCodeRepo, specialDetector, clipboardAdapter, launcherAdapter);

        InitializeLayout();
        RegisterEvents();
    }

    private void InitializeLayout()
    {
        Dock = DockStyle.Fill;
        BackColor = AppColors.BackgroundDark;
        Padding = new Padding(8, 8, 2, 8);

        var scrollPanel = new SlimScrollPanel { Dock = DockStyle.Fill };

        _tabs = new SchemaSelectorTabs();
        _tabs.LoadSchemas(_schemaManager.Schemas, _stateHook.ActiveSchemaId);
        _rawInputBox = new RawInputBox();
        _specialAlertBox = new SpecialCodeAlertBox();
        _fieldEditor = new LeadFieldEditor();
        _previewBox = new OutputPreviewBox();
        _historyBox = new RecentHistoryBox();

        scrollPanel.Content.Controls.Add(_historyBox);
        scrollPanel.Content.Controls.Add(_previewBox);
        scrollPanel.Content.Controls.Add(_fieldEditor);
        scrollPanel.Content.Controls.Add(_specialAlertBox);
        scrollPanel.Content.Controls.Add(_rawInputBox);
        scrollPanel.Content.Controls.Add(_tabs);

        Controls.Add(scrollPanel);
    }

    private void RegisterEvents()
    {
        _tabs.SchemaSelected += schemaId => { _stateHook.SetActiveSchema(schemaId); StatusMessageUpdated?.Invoke($"Đã chọn mẫu: {schemaId}"); };
        _tabs.AddCodeRequested += OnAddCodeRequested;
        _rawInputBox.RawInputChanged += OnRawInputChanged;
        _rawInputBox.ClearRequested += ClearAllInputs;
        _fieldEditor.FieldsChanged += () => { if (!_isInternalSync) _stateHook.UpdateLeadFields(_fieldEditor.GetValues()); };
        _previewBox.CopyRequested += () => { if (_stateHook.CopyOutputToClipboard()) { _previewBox.ShowCopySuccess(); StatusMessageUpdated?.Invoke("Đã sao chép tin nhắn vào Clipboard."); } };
        _historyBox.HistoryItemSelected += OnHistoryItemSelected;

        _specialAlertBox.CopyPhoneRequested += phone => { if (_stateHook.CopyTextToClipboard(phone)) StatusMessageUpdated?.Invoke($"Đã sao chép SĐT: {phone}"); };
        _specialAlertBox.OpenUrlRequested += url => { if (!_stateHook.OpenUrl(url)) StatusMessageUpdated?.Invoke("Không thể mở liên kết trình duyệt."); };

        _stateHook.StateChanged += () => { _previewBox.SetOutputText(_stateHook.FormattedOutput); _tabs.SetAddCodeState(_stateHook.IsAddCodeButtonEnabled, _stateHook.CurrentLead.RoomCode, _stateHook.ActiveSchemaId); };
        _stateHook.SchemaAutoDetected += schemaId => { _tabs.SetActive(schemaId); StatusMessageUpdated?.Invoke($"⚡ Đã tự động nhận diện sàn: {_schemaManager.GetSchemaById(schemaId)?.Name ?? schemaId}"); };
        _stateHook.DetectionResultChanged += res => { _tabs.SetDetectionStatus(res.Status, res.ConflictMessage, res.CandidateSchemaIds); _tabs.SetAddCodeState(_stateHook.IsAddCodeButtonEnabled, _stateHook.CurrentLead.RoomCode, _stateHook.ActiveSchemaId); };
        _stateHook.SpecialMappingDetected += mapping => FormStateObserver.InvokeOnUI(this, () => _specialAlertBox.BindData(mapping));
        _stateHook.OperationFeedback += (msg, _) => StatusMessageUpdated?.Invoke(msg);
        _converterService.Converted += (_, item) => FormStateObserver.InvokeOnUI(this, () => _historyBox.AddHistoryItem(item));
    }

    private void OnAddCodeRequested(string schemaId, string roomCode)
    {
        var groupName = _roomCodeRepo.GetGroupName(schemaId) ?? schemaId;
        var confirm = MessageBox.Show(
            $"Bạn có chắc chắn muốn thêm mã '{roomCode}' vào nhóm '{groupName}' không?",
            "Xác nhận thêm mã phòng",
            MessageBoxButtons.YesNo,
            MessageBoxIcon.Question);

        if (confirm == DialogResult.Yes)
        {
            _stateHook.ConfirmAddRoomCode(roomCode, schemaId);
        }
    }

    private void OnRawInputChanged(string raw)
    {
        if (_isInternalSync) return;
        _stateHook.ProcessRawInput(raw);
        _isInternalSync = true;
        _fieldEditor.SetValues(_stateHook.CurrentLead);
        _isInternalSync = false;
    }

    private void OnHistoryItemSelected(int index)
    {
        if (index < 0 || index >= _converterService.History.Count) return;
        var item = _converterService.History[index];
        _isInternalSync = true;
        _rawInputBox.SetText(item.RawInput);
        _fieldEditor.SetValues(item.Lead);
        _stateHook.UpdateLeadFields(item.Lead);
        _isInternalSync = false;
    }

    public void ClearAllInputs()
    {
        _isInternalSync = true;
        _rawInputBox.Clear();
        _fieldEditor.ClearValues();
        _stateHook.ProcessRawInput(string.Empty);
        _isInternalSync = false;
        StatusMessageUpdated?.Invoke("Đã xóa sạch nội dung.");
    }

    public void NotifyCtvUpdated() => _stateHook.RecalculateOutput();
}
