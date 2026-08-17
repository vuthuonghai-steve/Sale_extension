using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Frontend.Screens.LeadConverter.Components;
using AppForms.Frontend.Screens.LeadConverter.Hooks;
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
        IRoomCodeRepository roomCodeRepo)
    {
        _converterService = converterService;
        _schemaManager = schemaManager;
        _roomCodeRepo = roomCodeRepo;
        _stateHook = new LeadConverterStateHook(converterService, schemaManager, templateEngine, settingsService, schemaDetector, roomCodeRepo);

        InitializeLayout();
        RegisterEvents();
    }

    private void InitializeLayout()
    {
        Dock = DockStyle.Fill;
        BackColor = AppColors.BackgroundDark;
        AutoScroll = true;
        Padding = new Padding(10);

        var contentStack = new Panel { Dock = DockStyle.Top, AutoSize = true, BackColor = AppColors.BackgroundDark };

        _tabs = new SchemaSelectorTabs();
        _tabs.LoadSchemas(_schemaManager.Schemas, _stateHook.ActiveSchemaId);
        _rawInputBox = new RawInputBox();
        _fieldEditor = new LeadFieldEditor();
        _previewBox = new OutputPreviewBox();
        _historyBox = new RecentHistoryBox();

        contentStack.Controls.Add(_historyBox);
        contentStack.Controls.Add(_previewBox);
        contentStack.Controls.Add(_fieldEditor);
        contentStack.Controls.Add(_rawInputBox);
        contentStack.Controls.Add(_tabs);
        Controls.Add(contentStack);
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

        _stateHook.StateChanged += () => { _previewBox.SetOutputText(_stateHook.FormattedOutput); _tabs.SetAddCodeState(_stateHook.IsAddCodeButtonEnabled, _stateHook.CurrentLead.RoomCode, _stateHook.ActiveSchemaId); };
        _stateHook.SchemaAutoDetected += schemaId => { _tabs.SetActive(schemaId); StatusMessageUpdated?.Invoke($"⚡ Đã tự động nhận diện sàn: {_schemaManager.GetSchemaById(schemaId)?.Name ?? schemaId}"); };
        _stateHook.DetectionResultChanged += res => { _tabs.SetDetectionStatus(res.Status, res.ConflictMessage, res.CandidateSchemaIds); _tabs.SetAddCodeState(_stateHook.IsAddCodeButtonEnabled, _stateHook.CurrentLead.RoomCode, _stateHook.ActiveSchemaId); };
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
