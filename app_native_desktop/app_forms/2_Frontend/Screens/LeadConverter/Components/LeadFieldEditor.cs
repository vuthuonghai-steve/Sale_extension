using System.Drawing;
using AppForms.Backend.Contracts.Entities;
using AppForms.Frontend.Shared.Components;
using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Screens.LeadConverter.Components;

public class LeadFieldEditor : Panel
{
    private Panel _headerPanel = null!;
    private Label _lblTitle = null!;
    private Label _lblToggleIcon = null!;
    private TableLayoutPanel _table = null!;

    private TextBox _txtAddress = null!;
    private TextBox _txtPrice = null!;
    private TextBox _txtRoomCode = null!;
    private TextBox _txtViewTime = null!;
    private TextBox _txtCustomerName = null!;
    private TextBox _txtCustomerPhone = null!;
    private TextBox _txtNotes = null!;

    private bool _isExpanded;

    public event Action? FieldsChanged;

    public LeadFieldEditor()
    {
        Dock = DockStyle.Top;
        AutoSize = true;
        BackColor = AppColors.SurfaceDark;
        Padding = new Padding(6, 4, 6, 6);
        Margin = new Padding(0, 0, 0, 6);

        InitializeLayout();
    }

    private void InitializeLayout()
    {
        // 1. Clickable Header / Dropdown Toggle
        _headerPanel = new Panel
        {
            Dock = DockStyle.Top,
            Height = 32,
            BackColor = AppColors.SurfaceHighlight,
            Cursor = Cursors.Hand,
            Padding = new Padding(8, 6, 8, 6)
        };

        _lblTitle = new Label
        {
            Text = "📝 CHI TIẾT CÁC TRƯỜNG DỮ LIỆU",
            Font = AppFonts.SubHeader,
            ForeColor = AppColors.TextPrimary,
            AutoSize = true,
            Location = new Point(8, 7),
            Cursor = Cursors.Hand
        };

        _lblToggleIcon = new Label
        {
            Text = "▶ Mở rộng",
            Font = AppFonts.Badge,
            ForeColor = AppColors.PrimaryHover,
            AutoSize = true,
            Anchor = AnchorStyles.Top | AnchorStyles.Right,
            Location = new Point(_headerPanel.Width - 90, 8),
            Cursor = Cursors.Hand
        };

        _headerPanel.Controls.Add(_lblTitle);
        _headerPanel.Controls.Add(_lblToggleIcon);

        _headerPanel.Click += ToggleExpansion;
        _lblTitle.Click += ToggleExpansion;
        _lblToggleIcon.Click += ToggleExpansion;

        _headerPanel.MouseEnter += (_, _) => _headerPanel.BackColor = AppColors.BorderHighlight;
        _headerPanel.MouseLeave += (_, _) => _headerPanel.BackColor = AppColors.SurfaceHighlight;

        // 2. Collapsible Fields Table
        _table = new TableLayoutPanel
        {
            Dock = DockStyle.Top,
            AutoSize = true,
            ColumnCount = 2,
            RowCount = 7,
            Visible = false, // Mặc định thu gọn (collapsed)
            Padding = new Padding(0, 6, 0, 4)
        };
        _table.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 90));
        _table.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));

        _txtAddress = AddRow(_table, "Địa chỉ:", 0);
        _txtPrice = AddRow(_table, "Giá phòng:", 1);
        _txtRoomCode = AddRow(_table, "Mã phòng:", 2);
        _txtViewTime = AddRow(_table, "Giờ xem:", 3);
        _txtCustomerName = AddRow(_table, "Tên KH:", 4);
        _txtCustomerPhone = AddRow(_table, "SĐT:", 5);
        _txtNotes = AddRow(_table, "Ghi chú:", 6);

        Controls.Add(_table);
        Controls.Add(_headerPanel);
    }

    private void ToggleExpansion(object? sender, EventArgs e)
    {
        _isExpanded = !_isExpanded;
        _table.Visible = _isExpanded;
        _lblToggleIcon.Text = _isExpanded ? "▼ Thu gọn" : "▶ Mở rộng";
        _lblToggleIcon.ForeColor = _isExpanded ? AppColors.Warning : AppColors.PrimaryHover;
    }

    private TextBox AddRow(TableLayoutPanel table, string labelText, int row)
    {
        var lbl = new Label
        {
            Text = labelText,
            Font = AppFonts.Caption,
            ForeColor = AppColors.TextMuted,
            Dock = DockStyle.Fill,
            TextAlign = ContentAlignment.MiddleRight
        };

        var txt = new TextBox
        {
            Dock = DockStyle.Fill,
            Font = AppFonts.Body,
            BackColor = AppColors.SurfaceInput,
            ForeColor = AppColors.TextPrimary,
            BorderStyle = BorderStyle.FixedSingle
        };
        txt.TextChanged += (_, _) => FieldsChanged?.Invoke();

        table.Controls.Add(lbl, 0, row);
        table.Controls.Add(txt, 1, row);
        return txt;
    }

    public void SetValues(LeadEntity lead)
    {
        _txtAddress.Text = lead.Address ?? string.Empty;
        _txtPrice.Text = lead.Price ?? string.Empty;
        _txtRoomCode.Text = lead.RoomCode ?? string.Empty;
        _txtViewTime.Text = lead.ViewTime ?? string.Empty;
        _txtCustomerName.Text = lead.CustomerName ?? string.Empty;
        _txtCustomerPhone.Text = lead.CustomerPhone ?? string.Empty;
        _txtNotes.Text = lead.RawNotes ?? string.Empty;

        // Cập nhật số trường đã có dữ liệu lên header
        var count = 0;
        if (!string.IsNullOrWhiteSpace(_txtAddress.Text)) count++;
        if (!string.IsNullOrWhiteSpace(_txtPrice.Text)) count++;
        if (!string.IsNullOrWhiteSpace(_txtRoomCode.Text)) count++;
        if (!string.IsNullOrWhiteSpace(_txtViewTime.Text)) count++;
        if (!string.IsNullOrWhiteSpace(_txtCustomerName.Text)) count++;
        if (!string.IsNullOrWhiteSpace(_txtCustomerPhone.Text)) count++;
        if (!string.IsNullOrWhiteSpace(_txtNotes.Text)) count++;

        _lblTitle.Text = $"📝 CHI TIẾT TRƯỜNG ({count}/7 đã điền)";
    }

    public LeadEntity GetValues()
    {
        return new LeadEntity
        {
            Address = string.IsNullOrWhiteSpace(_txtAddress.Text) ? null : _txtAddress.Text.Trim(),
            Price = string.IsNullOrWhiteSpace(_txtPrice.Text) ? null : _txtPrice.Text.Trim(),
            RoomCode = string.IsNullOrWhiteSpace(_txtRoomCode.Text) ? null : _txtRoomCode.Text.Trim(),
            ViewTime = string.IsNullOrWhiteSpace(_txtViewTime.Text) ? null : _txtViewTime.Text.Trim(),
            CustomerName = string.IsNullOrWhiteSpace(_txtCustomerName.Text) ? null : _txtCustomerName.Text.Trim(),
            CustomerPhone = string.IsNullOrWhiteSpace(_txtCustomerPhone.Text) ? null : _txtCustomerPhone.Text.Trim(),
            RawNotes = string.IsNullOrWhiteSpace(_txtNotes.Text) ? null : _txtNotes.Text.Trim()
        };
    }

    public void ClearValues()
    {
        _txtAddress.Clear();
        _txtPrice.Clear();
        _txtRoomCode.Clear();
        _txtViewTime.Clear();
        _txtCustomerName.Clear();
        _txtCustomerPhone.Clear();
        _txtNotes.Clear();
        _lblTitle.Text = "📝 CHI TIẾT CÁC TRƯỜNG DỮ LIỆU";
    }
}
