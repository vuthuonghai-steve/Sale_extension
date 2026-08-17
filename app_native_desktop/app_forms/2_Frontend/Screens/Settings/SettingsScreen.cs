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

    private Panel _containerPanel = null!;
    private ModernButton _btnTabGeneral = null!;
    private ModernButton _btnTabCodes = null!;

    public event Action? SettingsSaved;

    public SettingsScreen(ISettingsService settingsService, IRoomCodeRepository roomCodeRepo)
    {
        _stateHook = new SettingsStateHook(settingsService, roomCodeRepo);
        _generalPanel = new SettingsGeneralPanel();
        _roomCodePanel = new RoomCodeManagementPanel();

        InitializeLayout();
        RegisterHookEvents();

        _stateHook.LoadGeneralSettings();
        _stateHook.LoadRoomCodes();
    }

    private void InitializeLayout()
    {
        Dock = DockStyle.Fill;
        BackColor = AppColors.BackgroundDark;
        Padding = new Padding(10);

        var topTabBar = new Panel
        {
            Dock = DockStyle.Top,
            Height = 36,
            BackColor = AppColors.SurfaceInput,
            Padding = new Padding(4)
        };

        _btnTabGeneral = new ModernButton
        {
            Text = "⚙️ Cài Đặt Chung",
            Size = new Size(130, 28),
            Font = AppFonts.CaptionBold,
            CustomBackColor = AppColors.Primary,
            Location = new Point(4, 4)
        };
        _btnTabGeneral.Click += (_, _) => SwitchTab(isGeneral: true);

        _btnTabCodes = new ModernButton
        {
            Text = "🏢 Quản Lý Mã Sàn",
            Size = new Size(140, 28),
            Font = AppFonts.Caption,
            CustomBackColor = AppColors.SurfaceHighlight,
            Location = new Point(_btnTabGeneral.Right + 8, 4)
        };
        _btnTabCodes.Click += (_, _) => SwitchTab(isGeneral: false);

        topTabBar.Controls.Add(_btnTabGeneral);
        topTabBar.Controls.Add(_btnTabCodes);

        _containerPanel = new Panel
        {
            Dock = DockStyle.Fill,
            BackColor = AppColors.BackgroundDark,
            Padding = new Padding(0, 8, 0, 0)
        };

        _generalPanel.Dock = DockStyle.Fill;
        _roomCodePanel.Dock = DockStyle.Fill;
        _containerPanel.Controls.Add(_generalPanel);

        Controls.Add(_containerPanel);
        Controls.Add(topTabBar);
    }

    public void ReloadData()
    {
        _stateHook.LoadRoomCodes();
        _stateHook.LoadGeneralSettings();
    }

    private void SwitchTab(bool isGeneral)
    {
        _containerPanel.Controls.Clear();
        if (isGeneral)
        {
            _containerPanel.Controls.Add(_generalPanel);
            _btnTabGeneral.CustomBackColor = AppColors.Primary;
            _btnTabGeneral.Font = AppFonts.CaptionBold;
            _btnTabCodes.CustomBackColor = AppColors.SurfaceHighlight;
            _btnTabCodes.Font = AppFonts.Caption;
        }
        else
        {
            _stateHook.LoadRoomCodes();
            _containerPanel.Controls.Add(_roomCodePanel);
            _btnTabCodes.CustomBackColor = AppColors.Primary;
            _btnTabCodes.Font = AppFonts.CaptionBold;
            _btnTabGeneral.CustomBackColor = AppColors.SurfaceHighlight;
            _btnTabGeneral.Font = AppFonts.Caption;
        }
    }

    private void RegisterHookEvents()
    {
        // 1. General Settings
        _stateHook.GeneralSettingsLoaded += model => _generalPanel.BindData(model);
        _generalPanel.SaveRequested += model => _stateHook.SaveGeneralSettings(model);
        _stateHook.GeneralSettingsSaved += () =>
        {
            _generalPanel.ShowSaveSuccessFeedback();
            SettingsSaved?.Invoke();
        };

        // 2. Room Code Management
        _roomCodePanel.SchemaSelected += schemaId => _stateHook.SelectSchema(schemaId);
        _roomCodePanel.AddCodesRequested += (schemaId, raw) => _stateHook.AddCodes(schemaId, raw);
        _roomCodePanel.RemoveCodeRequested += (schemaId, code) => _stateHook.RemoveCode(schemaId, code);

        _stateHook.RoomGroupsReloaded += (groups, selectedId) => _roomCodePanel.BindGroups(groups, selectedId);
        _stateHook.RoomCodesUpdated += group => _roomCodePanel.UpdateCurrentGroup(group);
        _stateHook.OperationFeedback += (msg, isSuccess) => _roomCodePanel.ShowFeedback(msg, isSuccess);
    }
}
