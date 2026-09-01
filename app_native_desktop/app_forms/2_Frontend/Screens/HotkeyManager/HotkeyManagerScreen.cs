using System;
using System.Drawing;
using System.Windows.Forms;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Frontend.Screens.HotkeyManager.Components;
using AppForms.Frontend.Screens.HotkeyManager.Hooks;
using AppForms.Frontend.Shared.Hooks;
using AppForms.Frontend.Shared.Theme;
using Microsoft.Extensions.Logging;

namespace AppForms.Frontend.Screens.HotkeyManager;

/// <summary>
/// Màn hình UI Quản lý & Can thiệp Phím tắt Toàn Cục (Root Screen <= 150 lines)
/// </summary>
public class HotkeyManagerScreen : UserControl
{
    private readonly HotkeyManagerStateHook _hook;
    private readonly HotkeyMasterHeaderPanel _headerPanel;
    private readonly HotkeyListPanel _listPanel;

    public event Action<string>? StatusMessageUpdated;

    public HotkeyManagerScreen(
        IHotkeyManager hotkeyManager,
        ITextSnippetService snippetService,
        ILogger<HotkeyManagerStateHook> hookLogger)
    {
        _hook = new HotkeyManagerStateHook(hotkeyManager, snippetService, hookLogger);
        _headerPanel = new HotkeyMasterHeaderPanel();
        _listPanel = new HotkeyListPanel();

        InitializeLayout();
        RegisterHookEvents();
        RefreshUI();
    }

    private void InitializeLayout()
    {
        Dock = DockStyle.Fill;
        BackColor = AppColors.BackgroundDark;
        Padding = new Padding(10);

        Controls.Add(_listPanel);
        Controls.Add(_headerPanel);
    }

    private void RegisterHookEvents()
    {
        _hook.StateUpdated += () => FormStateObserver.InvokeOnUI(this, RefreshUI);

        _hook.FeedbackReceived += (msg, isSuccess) => FormStateObserver.InvokeOnUI(this, () =>
        {
            StatusMessageUpdated?.Invoke(msg);
        });

        _headerPanel.GlobalListeningToggled += () => _hook.ToggleGlobalListening();
        _listPanel.HotkeyToggled += hotkeyId => _hook.ToggleHotkey(hotkeyId);
        _listPanel.HotkeyTestRequested += hotkeyId => _hook.TestTriggerHotkey(hotkeyId);
    }

    public void RefreshUI()
    {
        _headerPanel.BindData(_hook.CurrentModel);
        _listPanel.BindItems(_hook.CurrentModel.Items, _hook.CurrentModel.IsGlobalListening);
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _hook.Dispose();
            _headerPanel.Dispose();
            _listPanel.Dispose();
        }
        base.Dispose(disposing);
    }
}
