using AppForms.Frontend.Screens.Settings.Models;
using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Screens.Settings.Components;

/// <summary>
/// Sub-Component: Card tiêu đề và bộ chọn Sàn đích (Schema ComboBox)
/// </summary>
public class RoomCodeHeaderCard : Panel
{
    private ComboBox _cboSchemas = null!;
    private List<RoomCodeGroupViewModel> _groups = new();
    private string _selectedSchemaId = string.Empty;
    private bool _isUpdating;

    public event Action<string>? SchemaSelected;

    public RoomCodeHeaderCard()
    {
        InitializeUI();
    }

    private void InitializeUI()
    {
        Dock = DockStyle.Top;
        Height = 110;
        BackColor = AppColors.SurfaceDark;
        Padding = new Padding(12);
        Margin = new Padding(0, 0, 0, 8);

        var lblTitle = new Label
        {
            Text = "🏢 QUẢN LÝ KHO MÃ PHÒNG",
            Font = AppFonts.Header,
            ForeColor = AppColors.TextPrimary,
            Dock = DockStyle.Top,
            Height = 26
        };

        var lblDesc = new Label
        {
            Text = "Danh mục mã nhận diện tự động cho 7 sàn đích (Single Source of Mutation)",
            Font = AppFonts.Caption,
            ForeColor = AppColors.TextSecondary,
            Dock = DockStyle.Top,
            Height = 20
        };

        var selectorPanel = new Panel
        {
            Dock = DockStyle.Top,
            Height = 36,
            Padding = new Padding(0, 4, 0, 0)
        };

        var lblSelect = new Label
        {
            Text = "Sàn đích:",
            Font = AppFonts.SubHeader,
            ForeColor = AppColors.TextPrimary,
            Width = 70,
            Dock = DockStyle.Left,
            TextAlign = ContentAlignment.MiddleLeft
        };

        _cboSchemas = new ComboBox
        {
            Dock = DockStyle.Fill,
            DropDownStyle = ComboBoxStyle.DropDownList,
            Font = AppFonts.BodyBold,
            BackColor = AppColors.SurfaceInput,
            ForeColor = AppColors.TextPrimary,
            FlatStyle = FlatStyle.Flat
        };
        _cboSchemas.SelectedIndexChanged += (_, _) =>
        {
            if (_isUpdating) return;
            if (_cboSchemas.SelectedItem is RoomCodeGroupViewModel selected)
            {
                if (!string.Equals(_selectedSchemaId, selected.SchemaId, StringComparison.OrdinalIgnoreCase))
                {
                    _selectedSchemaId = selected.SchemaId;
                    SchemaSelected?.Invoke(selected.SchemaId);
                }
            }
        };

        selectorPanel.Controls.Add(_cboSchemas);
        selectorPanel.Controls.Add(lblSelect);

        Controls.Add(selectorPanel);
        Controls.Add(lblDesc);
        Controls.Add(lblTitle);
    }

    public void BindGroups(List<RoomCodeGroupViewModel> groups, string selectedSchemaId)
    {
        _isUpdating = true;
        try
        {
            _groups = groups;
            _selectedSchemaId = selectedSchemaId;
            _cboSchemas.Items.Clear();

            int selectedIndex = 0;
            for (int i = 0; i < _groups.Count; i++)
            {
                _cboSchemas.Items.Add(_groups[i]);
                if (_groups[i].SchemaId.Equals(selectedSchemaId, StringComparison.OrdinalIgnoreCase))
                {
                    selectedIndex = i;
                }
            }

            if (_cboSchemas.Items.Count > 0)
            {
                _cboSchemas.SelectedIndex = selectedIndex;
            }
        }
        finally
        {
            _isUpdating = false;
        }
    }

    public void RefreshDisplay()
    {
        _isUpdating = true;
        try
        {
            // Kích hoạt cập nhật text hiển thị trong ComboBox
            typeof(ComboBox).GetMethod("RefreshItems", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)?.Invoke(_cboSchemas, null);
        }
        finally
        {
            _isUpdating = false;
        }
    }
}
