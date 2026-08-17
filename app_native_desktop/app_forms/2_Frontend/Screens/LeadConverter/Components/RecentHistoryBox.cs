using AppForms.Backend.Contracts.Entities;
using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Screens.LeadConverter.Components;

public class RecentHistoryBox : Panel
{
    private ListBox _historyListBox = null!;

    public event Action<int>? HistoryItemSelected;

    public RecentHistoryBox()
    {
        Dock = DockStyle.Top;
        Height = 120;
        BackColor = AppColors.SurfaceDark;
        Padding = new Padding(8, 4, 8, 8);

        InitializeLayout();
    }

    private void InitializeLayout()
    {
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
        _historyListBox.SelectedIndexChanged += (_, _) =>
        {
            if (_historyListBox.SelectedIndex >= 0)
            {
                HistoryItemSelected?.Invoke(_historyListBox.SelectedIndex);
            }
        };

        Controls.Add(_historyListBox);
        Controls.Add(lblHeader);
    }

    public void AddHistoryItem(ConversionItem item)
    {
        var preview = !string.IsNullOrEmpty(item.Lead.Address) ? item.Lead.Address : (item.Lead.CustomerPhone ?? "Lead");
        var historyText = $"[{item.ConvertedAt:HH:mm:ss}] SĐT: {item.Lead.CustomerPhone ?? "N/A"} | {preview}";

        _historyListBox.Items.Insert(0, historyText);
        if (_historyListBox.SelectedIndex == -1)
        {
            _historyListBox.SelectedIndex = 0;
        }
    }

    public void Clear()
    {
        _historyListBox.Items.Clear();
    }
}
