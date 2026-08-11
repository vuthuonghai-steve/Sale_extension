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
    private readonly ISettingsService _settingsService;
    private readonly LeadConverterStateHook _stateHook;

    // UI Components
    private SchemaSelectorTabs _tabs = null!;
    private TextBox _txtRawInput = null!;
    private LeadFieldEditor _fieldEditor = null!;
    private OutputPreviewBox _previewBox = null!;
    private ListBox _historyListBox = null!;
    private bool _isInternalSync;

    public event Action<string>? StatusMessageUpdated;

    public LeadConverterScreen(
        IFormConverterService converterService,
        ISchemaManager schemaManager,
        ISettingsService settingsService,
        ITemplateEngine templateEngine,
        ISchemaDetector schemaDetector)
    {
        _converterService = converterService;
        _schemaManager = schemaManager;
        _settingsService = settingsService;
        _stateHook = new LeadConverterStateHook(converterService, schemaManager, templateEngine, settingsService, schemaDetector);

        InitializeLayout();
        RegisterEvents();
    }

    private void InitializeLayout()
    {
        Dock = DockStyle.Fill;
        BackColor = AppColors.BackgroundDark;
        AutoScroll = true;
        Padding = new Padding(10);

        // Container Panel for vertical stacking
        var contentStack = new Panel
        {
            Dock = DockStyle.Top,
            AutoSize = true,
            BackColor = AppColors.BackgroundDark
        };

        // 1. Schema Tabs
        _tabs = new SchemaSelectorTabs();
        _tabs.LoadSchemas(_schemaManager.Schemas, _stateHook.ActiveSchemaId);
        _tabs.SchemaSelected += OnSchemaSelected;

        // 2. Raw Input Area
        var rawInputPanel = BuildRawInputPanel();

        // 3. Lead Field Editor
        _fieldEditor = new LeadFieldEditor();
        _fieldEditor.FieldsChanged += OnFieldsChanged;

        // 4. Output Preview Box
        _previewBox = new OutputPreviewBox();
        _previewBox.CopyRequested += OnCopyRequested;

        // 5. Recent History
        var historyPanel = BuildHistoryPanel();

        // Add to stack (Order is important for DockStyle.Top)
        contentStack.Controls.Add(historyPanel);
        contentStack.Controls.Add(_previewBox);
        contentStack.Controls.Add(_fieldEditor);
        contentStack.Controls.Add(rawInputPanel);
        contentStack.Controls.Add(_tabs);

        Controls.Add(contentStack);
    }

    private Panel BuildRawInputPanel()
    {
        var panel = new Panel
        {
            Dock = DockStyle.Top,
            Height = 160,
            BackColor = AppColors.SurfaceDark,
            Padding = new Padding(8, 4, 8, 8)
        };

        var lblHeader = new Label
        {
            Text = "📥 DỮ LIỆU ĐẦU VÀO (RAW INPUT)",
            Font = AppFonts.SubHeader,
            ForeColor = AppColors.TextSecondary,
            Dock = DockStyle.Top,
            Height = 24
        };

        var topToolbar = new Panel { Dock = DockStyle.Top, Height = 34 };
        var btnPaste = new ModernButton
        {
            Text = "📋 Dán Clipboard",
            CustomBackColor = AppColors.Primary,
            Size = new Size(110, 26),
            Font = AppFonts.CaptionBold,
            Location = new Point(0, 2)
        };
        btnPaste.Click += (_, _) =>
        {
            if (Clipboard.ContainsText())
            {
                _txtRawInput.Text = Clipboard.GetText();
                OnRawInputChanged();
            }
        };

        var btnClear = new ModernButton
        {
            Text = "🗑️ Xóa",
            CustomBackColor = AppColors.SurfaceHighlight,
            CustomHoverColor = AppColors.BorderHighlight,
            Size = new Size(60, 26),
            Font = AppFonts.Caption,
            Location = new Point(btnPaste.Right + 6, 2)
        };
        btnClear.Click += (_, _) => ClearAllInputs();

        topToolbar.Controls.Add(btnPaste);
        topToolbar.Controls.Add(btnClear);

        _txtRawInput = new TextBox
        {
            Dock = DockStyle.Fill,
            Multiline = true,
            ScrollBars = ScrollBars.Vertical,
            BackColor = AppColors.SurfaceInput,
            ForeColor = AppColors.TextPrimary,
            BorderStyle = BorderStyle.FixedSingle,
            Font = AppFonts.Monospace,
            PlaceholderText = "Dán tin nhắn Zalo / Facebook / Ghi chú vào đây..."
        };
        _txtRawInput.TextChanged += (_, _) => OnRawInputChanged();

        panel.Controls.Add(_txtRawInput);
        panel.Controls.Add(topToolbar);
        panel.Controls.Add(lblHeader);

        return panel;
    }

    private Panel BuildHistoryPanel()
    {
        var panel = new Panel
        {
            Dock = DockStyle.Top,
            Height = 120,
            BackColor = AppColors.SurfaceDark,
            Padding = new Padding(8, 4, 8, 8)
        };

        var lblHeader = new Label
        {
            Text = "🕒 LỊCH SỬ GẦN ĐÂY",
            Font = AppFonts.SubHeader,
            ForeColor = AppColors.TextSecondary,
            Dock = DockStyle.Top,
            Height = 22
        };

        _historyListBox = new ListBox
        {
            Dock = DockStyle.Fill,
            BackColor = AppColors.SurfaceInput,
            ForeColor = AppColors.TextPrimary,
            BorderStyle = BorderStyle.None,
            Font = AppFonts.Caption,
            ItemHeight = 18
        };
        _historyListBox.SelectedIndexChanged += HistoryListBox_SelectedIndexChanged;

        panel.Controls.Add(_historyListBox);
        panel.Controls.Add(lblHeader);

        return panel;
    }

    private void RegisterEvents()
    {
        _stateHook.StateChanged += OnStateChanged;
        _stateHook.SchemaAutoDetected += OnSchemaAutoDetected;
        _converterService.Converted += OnLeadConverted;
    }

    private void OnSchemaAutoDetected(string schemaId)
    {
        _tabs.SetActive(schemaId);
        var schemaName = _schemaManager.GetSchemaById(schemaId)?.Name ?? schemaId;
        StatusMessageUpdated?.Invoke($"⚡ Đã tự động nhận diện sàn: {schemaName}");
    }

    private void OnSchemaSelected(string schemaId)
    {
        _stateHook.SetActiveSchema(schemaId);
        StatusMessageUpdated?.Invoke($"Đã chọn mẫu: {schemaId}");
    }

    private void OnRawInputChanged()
    {
        if (_isInternalSync) return;

        var raw = _txtRawInput.Text;
        if (string.IsNullOrWhiteSpace(raw)) return;

        _stateHook.ProcessRawInput(raw);

        _isInternalSync = true;
        _fieldEditor.SetValues(_stateHook.CurrentLead);
        _isInternalSync = false;
    }

    private void OnFieldsChanged()
    {
        if (_isInternalSync) return;

        var lead = _fieldEditor.GetValues();
        _stateHook.UpdateLeadFields(lead);
    }

    private void OnStateChanged()
    {
        _previewBox.SetOutputText(_stateHook.FormattedOutput);
    }

    private void OnCopyRequested()
    {
        var success = _stateHook.CopyOutputToClipboard();
        if (success)
        {
            StatusMessageUpdated?.Invoke("Đã sao chép tin nhắn vào Clipboard.");
        }
    }

    private void OnLeadConverted(object? sender, ConversionItem item)
    {
        FormStateObserver.InvokeOnUI(this, () =>
        {
            var preview = !string.IsNullOrEmpty(item.Lead.Address) ? item.Lead.Address : (item.Lead.CustomerPhone ?? "Lead");
            var historyText = $"[{item.ConvertedAt:HH:mm:ss}] SĐT: {item.Lead.CustomerPhone ?? "N/A"} | {preview}";

            _historyListBox.Items.Insert(0, historyText);
            if (_historyListBox.SelectedIndex == -1)
            {
                _historyListBox.SelectedIndex = 0;
            }
        });
    }

    private void HistoryListBox_SelectedIndexChanged(object? sender, EventArgs e)
    {
        var index = _historyListBox.SelectedIndex;
        if (index < 0 || index >= _converterService.History.Count) return;

        var item = _converterService.History[index];

        _isInternalSync = true;
        _txtRawInput.Text = item.RawInput;
        _fieldEditor.SetValues(item.Lead);
        _stateHook.UpdateLeadFields(item.Lead);
        _isInternalSync = false;
    }

    public void ClearAllInputs()
    {
        _isInternalSync = true;
        _txtRawInput.Clear();
        _fieldEditor.ClearValues();
        _previewBox.SetOutputText(string.Empty);
        _isInternalSync = false;
        StatusMessageUpdated?.Invoke("Đã xóa sạch nội dung.");
    }

    public void NotifyCtvUpdated()
    {
        _stateHook.RecalculateOutput();
    }
}
