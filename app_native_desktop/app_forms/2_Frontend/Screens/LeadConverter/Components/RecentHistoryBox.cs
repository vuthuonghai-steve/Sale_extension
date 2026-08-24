using System.Drawing;
using AppForms.Backend.Contracts.Entities;
using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Screens.LeadConverter.Components;

public class RecentHistoryBox : Panel
{
    private ComboBox _cboHistory = null!;
    private readonly List<ConversionItem> _items = new();
    private bool _isInternalUpdating;

    public event Action<int>? HistoryItemSelected;

    public RecentHistoryBox()
    {
        Dock = DockStyle.Top;
        Height = 36;
        BackColor = AppColors.SurfaceDark;
        Padding = new Padding(8, 4, 8, 4);

        InitializeLayout();
    }

    private void InitializeLayout()
    {
        var lblHeader = new Label
        {
            Text = "🕒 Lịch sử gần đây:",
            Font = AppFonts.Caption,
            ForeColor = AppColors.TextSecondary,
            Dock = DockStyle.Left,
            Width = 110,
            TextAlign = ContentAlignment.MiddleLeft
        };

        _cboHistory = new ComboBox
        {
            Dock = DockStyle.Fill,
            DropDownStyle = ComboBoxStyle.DropDownList,
            BackColor = AppColors.SurfaceInput,
            ForeColor = AppColors.TextPrimary,
            Font = AppFonts.Caption,
            FlatStyle = FlatStyle.Flat
        };

        _cboHistory.SelectedIndexChanged += (_, _) =>
        {
            if (_isInternalUpdating) return;
            var index = _cboHistory.SelectedIndex;
            if (index >= 0 && index < _items.Count)
            {
                HistoryItemSelected?.Invoke(index);
            }
        };

        Controls.Add(_cboHistory);
        Controls.Add(lblHeader);

        UpdateComboBoxDisplay();
    }

    public void AddHistoryItem(ConversionItem item)
    {
        _items.Insert(0, item);
        UpdateComboBoxDisplay();
        
        _isInternalUpdating = true;
        _cboHistory.SelectedIndex = 0;
        _isInternalUpdating = false;
    }

    public void Clear()
    {
        _items.Clear();
        UpdateComboBoxDisplay();
    }

    private void UpdateComboBoxDisplay()
    {
        _isInternalUpdating = true;
        _cboHistory.Items.Clear();

        if (_items.Count == 0)
        {
            _cboHistory.Items.Add("-- Chưa có lịch sử chuyển đổi --");
            _cboHistory.SelectedIndex = 0;
            _cboHistory.Enabled = false;
        }
        else
        {
            _cboHistory.Enabled = true;
            for (int i = 0; i < _items.Count; i++)
            {
                var item = _items[i];
                var preview = !string.IsNullOrEmpty(item.Lead.Address) ? item.Lead.Address : (item.Lead.CustomerPhone ?? "Lead");
                var text = $"[{item.ConvertedAt:HH:mm:ss}] SĐT: {item.Lead.CustomerPhone ?? "N/A"} | {preview}";
                _cboHistory.Items.Add(text);
            }
        }
        _isInternalUpdating = false;
    }
}
