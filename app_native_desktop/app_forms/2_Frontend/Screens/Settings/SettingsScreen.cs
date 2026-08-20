using AppForms.Backend.Contracts.Interfaces;
using AppForms.Frontend.Screens.Settings.Components;
using AppForms.Frontend.Screens.Settings.Hooks;
using AppForms.Frontend.Shared.Components;
using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Screens.Settings;

public class SettingsScreen : UserControl
{
    private readonly SettingsStateHook _stateHook;
    private readonly SettingsGeneralPanel _generalPanel;
    private readonly RoomCodeManagementPanel _roomCodePanel;
    private readonly SettingsMessageFilterPanel _filterPanel;

    private Panel _containerPanel = null!;
    private ModernButton _btnTabGeneral = null!;
    private ModernButton _btnTabCodes = null!;
    private ModernButton _btnTabFilter = null!;

    public event Action? SettingsSaved;

    public SettingsScreen(ISettingsService settingsService, IRoomCodeRepository roomCodeRepo)
    {
        _stateHook = new SettingsStateHook(settingsService, roomCodeRepo);
        _generalPanel = new SettingsGeneralPanel();
        _roomCodePanel = new RoomCodeManagementPanel();
        _filterPanel = new SettingsMessageFilterPanel();

        InitializeLayout();
        RegisterHookEvents();

        _stateHook.LoadGeneralSettings();
        _stateHook.LoadRoomCodes();
        _stateHook.LoadMessageFilterSettings();
    }

    private void InitializeLayout()
    {
        Dock = DockStyle.Fill;
        BackColor = AppColors.BackgroundDark;
        Padding = new Padding(10);

        var topTabBar = new Panel { Dock = DockStyle.Top, Height = 36, BackColor = AppColors.SurfaceInput, Padding = new Padding(4) };

        _btnTabGeneral = new ModernButton { Text = "⚙️ Cài Đặt", Size = new Size(95, 28), Font = AppFonts.CaptionBold, CustomBackColor = AppColors.Primary, Location = new Point(4, 4) };
        _btnTabGeneral.Click += (_, _) => SwitchTab(0);

        _btnTabCodes = new ModernButton { Text = "🏢 Mã Sàn", Size = new Size(95, 28), Font = AppFonts.Caption, CustomBackColor = AppColors.SurfaceHighlight, Location = new Point(_btnTabGeneral.Right + 4, 4) };
        _btnTabCodes.Click += (_, _) => SwitchTab(1);

        _btnTabFilter = new ModernButton { Text = "🧹 Lọc Copy", Size = new Size(100, 28), Font = AppFonts.Caption, CustomBackColor = AppColors.SurfaceHighlight, Location = new Point(_btnTabCodes.Right + 4, 4) };
        _btnTabFilter.Click += (_, _) => SwitchTab(2);

        topTabBar.Controls.Add(_btnTabGeneral);
        topTabBar.Controls.Add(_btnTabCodes);
        topTabBar.Controls.Add(_btnTabFilter);

        _containerPanel = new Panel { Dock = DockStyle.Fill, BackColor = AppColors.BackgroundDark, Padding = new Padding(0, 8, 0, 0) };
        _generalPanel.Dock = DockStyle.Fill;
        _roomCodePanel.Dock = DockStyle.Fill;
        _filterPanel.Dock = DockStyle.Fill;
        _containerPanel.Controls.Add(_generalPanel);

        Controls.Add(_containerPanel);
        Controls.Add(topTabBar);
    }

    public void ReloadData()
    {
        _stateHook.LoadRoomCodes();
        _stateHook.LoadGeneralSettings();
        _stateHook.LoadMessageFilterSettings();
    }

    private void SwitchTab(int tabIndex)
    {
        _containerPanel.Controls.Clear();
        _btnTabGeneral.CustomBackColor = tabIndex == 0 ? AppColors.Primary : AppColors.SurfaceHighlight;
        _btnTabCodes.CustomBackColor = tabIndex == 1 ? AppColors.Primary : AppColors.SurfaceHighlight;
        _btnTabFilter.CustomBackColor = tabIndex == 2 ? AppColors.Primary : AppColors.SurfaceHighlight;

        if (tabIndex == 0) _containerPanel.Controls.Add(_generalPanel);
        else if (tabIndex == 1) { _stateHook.LoadRoomCodes(); _containerPanel.Controls.Add(_roomCodePanel); }
        else { _stateHook.LoadMessageFilterSettings(); _containerPanel.Controls.Add(_filterPanel); }
    }

    private void RegisterHookEvents()
    {
        _stateHook.GeneralSettingsLoaded += model => _generalPanel.BindData(model);
        _generalPanel.SaveRequested += model => _stateHook.SaveGeneralSettings(model);
        _stateHook.GeneralSettingsSaved += () => { _generalPanel.ShowSaveSuccessFeedback(); SettingsSaved?.Invoke(); };

        _stateHook.MessageFilterOptionsLoaded += options => _filterPanel.BindData(options);
        _filterPanel.SaveRequested += options => _stateHook.SaveMessageFilterSettings(options);
        _stateHook.MessageFilterOptionsSaved += () => { _filterPanel.ShowSaveSuccessFeedback(); SettingsSaved?.Invoke(); };

        _roomCodePanel.SchemaSelected += schemaId => _stateHook.SelectSchema(schemaId);
        _roomCodePanel.AddCodesRequested += (schemaId, raw) => _stateHook.AddCodes(schemaId, raw);
        _roomCodePanel.RemoveCodeRequested += (schemaId, code) => _stateHook.RemoveCode(schemaId, code);
        _stateHook.RoomGroupsReloaded += (groups, selectedId) => _roomCodePanel.BindGroups(groups, selectedId);
        _stateHook.RoomCodesUpdated += group => _roomCodePanel.UpdateCurrentGroup(group);
        _stateHook.OperationFeedback += (msg, isSuccess) => _roomCodePanel.ShowFeedback(msg, isSuccess);
    }
}
