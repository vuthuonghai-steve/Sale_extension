using System.Drawing;
using AppForms.Backend.Contracts.Entities;
using AppForms.Frontend.Shared.Components;
using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Screens.LeadConverter.Components;

public class RecentHistoryBox : Panel
{
    private SlimScrollPanel _scrollPanel = null!;
    private Panel _itemsContainer = null!;
    private readonly List<ConversionItem> _items = new();
    private int _selectedIndex = -1;

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

        _scrollPanel = new SlimScrollPanel
        {
            Dock = DockStyle.Fill,
            BackColor = AppColors.SurfaceInput
        };

        _itemsContainer = new Panel
        {
            Dock = DockStyle.Top,
            AutoSize = true,
            AutoSizeMode = AutoSizeMode.GrowAndShrink,
            BackColor = AppColors.SurfaceInput
        };

        _scrollPanel.Content.Controls.Add(_itemsContainer);

        Controls.Add(_scrollPanel);
        Controls.Add(lblHeader);
    }

    public void AddHistoryItem(ConversionItem item)
    {
        _items.Insert(0, item);
        RenderItems();
        if (_selectedIndex == -1 && _items.Count > 0)
        {
            SelectItem(0);
        }
    }

    public void Clear()
    {
        _items.Clear();
        _selectedIndex = -1;
        RenderItems();
    }

    private void RenderItems()
    {
        _itemsContainer.SuspendLayout();
        _itemsContainer.Controls.Clear();

        for (int i = 0; i < _items.Count; i++)
        {
            var index = i;
            var item = _items[i];
            var preview = !string.IsNullOrEmpty(item.Lead.Address) ? item.Lead.Address : (item.Lead.CustomerPhone ?? "Lead");
            var historyText = $"[{item.ConvertedAt:HH:mm:ss}] SĐT: {item.Lead.CustomerPhone ?? "N/A"} | {preview}";

            var rowPanel = new Panel
            {
                Dock = DockStyle.Top,
                Height = 24,
                BackColor = (index == _selectedIndex) ? AppColors.SurfaceHighlight : AppColors.SurfaceInput,
                Padding = new Padding(6, 2, 6, 2),
                Cursor = Cursors.Hand
            };

            var lblText = new Label
            {
                Text = historyText,
                Font = AppFonts.Caption,
                ForeColor = (index == _selectedIndex) ? AppColors.TextPrimary : AppColors.TextSecondary,
                Dock = DockStyle.Fill,
                TextAlign = ContentAlignment.MiddleLeft,
                AutoEllipsis = true,
                Cursor = Cursors.Hand
            };

            void OnRowClicked(object? sender, EventArgs e)
            {
                SelectItem(index);
                HistoryItemSelected?.Invoke(index);
            }

            rowPanel.Click += OnRowClicked;
            lblText.Click += OnRowClicked;

            rowPanel.MouseEnter += (_, _) => { if (index != _selectedIndex) rowPanel.BackColor = AppColors.SurfaceHighlight; };
            rowPanel.MouseLeave += (_, _) => { if (index != _selectedIndex) rowPanel.BackColor = AppColors.SurfaceInput; };
            lblText.MouseEnter += (_, _) => { if (index != _selectedIndex) rowPanel.BackColor = AppColors.SurfaceHighlight; };
            lblText.MouseLeave += (_, _) => { if (index != _selectedIndex) rowPanel.BackColor = AppColors.SurfaceInput; };

            rowPanel.Controls.Add(lblText);
            // Thêm ngược để Dock.Top sắp xếp đúng thứ tự 0 -> N
            _itemsContainer.Controls.Add(rowPanel);
            _itemsContainer.Controls.SetChildIndex(rowPanel, 0);
        }

        _itemsContainer.ResumeLayout();
        _scrollPanel.UpdateScrollParameters();
    }

    private void SelectItem(int index)
    {
        _selectedIndex = index;
        for (int i = 0; i < _itemsContainer.Controls.Count; i++)
        {
            var row = _itemsContainer.Controls[i];
            var isSelected = (i == (_itemsContainer.Controls.Count - 1 - index));
            row.BackColor = isSelected ? AppColors.SurfaceHighlight : AppColors.SurfaceInput;
            if (row.Controls.Count > 0 && row.Controls[0] is Label lbl)
            {
                lbl.ForeColor = isSelected ? AppColors.TextPrimary : AppColors.TextSecondary;
            }
        }
    }
}
