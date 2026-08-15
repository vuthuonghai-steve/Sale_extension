using AppForms.Frontend.Screens.Settings.Models;
using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Screens.Settings.Components;

/// <summary>
/// Container Component: Quản lý Kho Mã Phòng - Lắp ráp các Sub-Components nhỏ
/// </summary>
public class RoomCodeManagementPanel : Panel
{
    private readonly RoomCodeHeaderCard _headerCard;
    private readonly RoomCodeAddCard _addCard;
    private readonly RoomCodeListCard _listCard;
    private readonly Label _lblStatusFeedback;
    private System.Windows.Forms.Timer? _feedbackTimer;

    private RoomCodeGroupViewModel? _currentGroup;

    public event Action<string>? SchemaSelected;
    public event Action<string, string>? AddCodesRequested; // (schemaId, rawInput)
    public event Action<string, string>? RemoveCodeRequested; // (schemaId, code)

    public RoomCodeManagementPanel()
    {
        _headerCard = new RoomCodeHeaderCard();
        _addCard = new RoomCodeAddCard();
        _listCard = new RoomCodeListCard();

        _lblStatusFeedback = new Label
        {
            Dock = DockStyle.Top,
            Height = 28,
            Font = AppFonts.CaptionBold,
            ForeColor = AppColors.TextPrimary,
            BackColor = AppColors.SurfaceHighlight,
            TextAlign = ContentAlignment.MiddleCenter,
            Visible = false
        };

        InitializeUI();
        RegisterSubComponentEvents();
    }

    private void InitializeUI()
    {
        Dock = DockStyle.Fill;
        BackColor = AppColors.BackgroundDark;
        AutoScroll = true;
        Padding = new Padding(12);

        var spacer1 = new Panel { Dock = DockStyle.Top, Height = 8 };
        var spacerFeedback = new Panel { Dock = DockStyle.Top, Height = 8 };
        var spacer2 = new Panel { Dock = DockStyle.Top, Height = 8 };

        // Thứ tự thêm vào Controls theo DockStyle đảo ngược
        Controls.Add(_listCard);
        Controls.Add(spacer2);
        Controls.Add(_addCard);
        Controls.Add(spacerFeedback);
        Controls.Add(_lblStatusFeedback);
        Controls.Add(spacer1);
        Controls.Add(_headerCard);
    }

    private void RegisterSubComponentEvents()
    {
        _headerCard.SchemaSelected += schemaId =>
        {
            _listCard.ResetSearch();
            SchemaSelected?.Invoke(schemaId);
        };

        _addCard.AddCodesRequested += rawInput =>
        {
            if (_currentGroup != null)
            {
                AddCodesRequested?.Invoke(_currentGroup.SchemaId, rawInput);
            }
        };

        _listCard.RemoveCodeRequested += (schemaId, code) =>
        {
            RemoveCodeRequested?.Invoke(schemaId, code);
        };
    }

    public void BindGroups(List<RoomCodeGroupViewModel> groups, string selectedSchemaId)
    {
        _headerCard.BindGroups(groups, selectedSchemaId);
    }

    public void UpdateCurrentGroup(RoomCodeGroupViewModel group)
    {
        _currentGroup = group;
        _listCard.RenderCodes(group.SchemaId, group.DisplayName, group.Codes);
    }

    public void ShowFeedback(string message, bool isSuccess)
    {
        _lblStatusFeedback.Text = message;
        _lblStatusFeedback.ForeColor = AppColors.TextPrimary;
        _lblStatusFeedback.BackColor = isSuccess ? AppColors.Success : AppColors.Danger;
        _lblStatusFeedback.Visible = true;

        _feedbackTimer?.Stop();
        _feedbackTimer?.Dispose();

        _feedbackTimer = new System.Windows.Forms.Timer { Interval = 2500 };
        _feedbackTimer.Tick += (_, _) =>
        {
            _lblStatusFeedback.Visible = false;
            _feedbackTimer?.Stop();
            _feedbackTimer?.Dispose();
            _feedbackTimer = null;
        };
        _feedbackTimer.Start();
    }
}
