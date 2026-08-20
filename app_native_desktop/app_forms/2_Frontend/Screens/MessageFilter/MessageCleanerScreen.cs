using AppForms.Backend.Contracts.Interfaces;
using AppForms.Frontend.Screens.MessageFilter.Components;
using AppForms.Frontend.Screens.MessageFilter.Hooks;
using AppForms.Frontend.Shared.Hooks;
using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Screens.MessageFilter;

/// <summary>
/// Màn hình Lọc và Làm sạch Tin nhắn Bất động sản / Bán hàng từ Clipboard
/// </summary>
public class MessageCleanerScreen : UserControl
{
    private readonly MessageCleanerStateHook _stateHook;
    private readonly FilterToggleSwitchPanelComponent _togglePanel;
    private readonly LiveClipboardPreviewComponent _previewPanel;
    private readonly PipelineExecutionLogComponent _logPanel;

    public event Action<string>? StatusMessageUpdated;

    public MessageCleanerScreen(IFilterPipelineOrchestrator orchestrator)
    {
        _stateHook = new MessageCleanerStateHook(orchestrator);
        _togglePanel = new FilterToggleSwitchPanelComponent();
        _previewPanel = new LiveClipboardPreviewComponent();
        _logPanel = new PipelineExecutionLogComponent();

        InitializeLayout();
        RegisterHookEvents();

        _stateHook.LoadInitialState();
    }

    private void InitializeLayout()
    {
        Dock = DockStyle.Fill;
        BackColor = AppColors.BackgroundDark;
        Padding = new Padding(8);

        _togglePanel.Dock = DockStyle.Top;
        _logPanel.Dock = DockStyle.Bottom;
        _previewPanel.Dock = DockStyle.Fill;

        Controls.Add(_previewPanel);
        Controls.Add(_logPanel);
        Controls.Add(_togglePanel);
    }

    private void RegisterHookEvents()
    {
        // 1. Đồng bộ trạng thái và Options
        _stateHook.StateUpdated += (isRunning, options) =>
        {
            FormStateObserver.InvokeOnUI(this, () => _togglePanel.BindData(isRunning, options));
        };

        // 2. Nhận báo cáo lọc từ Clipboard hoặc Manual
        _stateHook.ReportReceived += report =>
        {
            FormStateObserver.InvokeOnUI(this, () =>
            {
                _previewPanel.BindData(report.RawText, report.CleanedText, report.IsModified, report.ElapsedMilliseconds, report.AppliedFilters);
                _logPanel.AddReport(report);
            });
        };

        // 3. Phản hồi thông báo trạng thái
        _stateHook.OperationFeedback += (msg, isSuccess) =>
        {
            FormStateObserver.InvokeOnUI(this, () => StatusMessageUpdated?.Invoke(msg));
        };

        // 4. UI Events tương tác
        _togglePanel.ServiceToggled += enable => _stateHook.ToggleService(enable);
        _togglePanel.OptionsChanged += options => _stateHook.UpdateOptions(options);

        _previewPanel.CleanRequested += rawText => _stateHook.ProcessManual(rawText);
        _previewPanel.CopyRequested += cleanedText => _stateHook.CopyToClipboard(cleanedText);

        _logPanel.LogSelected += report =>
        {
            _previewPanel.BindData(report.RawText, report.CleanedText, report.IsModified, report.ElapsedMilliseconds, report.AppliedFilters);
        };
    }
}
