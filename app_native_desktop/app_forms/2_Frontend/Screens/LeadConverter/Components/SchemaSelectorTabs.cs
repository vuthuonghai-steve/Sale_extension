using AppForms.Backend.Contracts.Entities;
using AppForms.Frontend.Shared.Components;
using AppForms.Frontend.Shared.Theme;

namespace AppForms.Frontend.Screens.LeadConverter.Components;

public class SchemaSelectorTabs : Panel
{
    private readonly ComboBox _cboSchemas;
    private readonly Label _lblTitle;
    private readonly Label _lblCountBadge;
    private readonly ModernButton _btnPrev;
    private readonly ModernButton _btnNext;
    private readonly List<FormatSchema> _schemas = new();
    private bool _isInternalUpdating;

    public event Action<string>? SchemaSelected;

    public SchemaSelectorTabs()
    {
        Dock = DockStyle.Top;
        Height = 58;
        Padding = new Padding(8, 4, 8, 6);
        Margin = new Padding(0, 0, 0, 6);
        BackColor = AppColors.SurfaceDark;

        // 1. Header Bar
        var headerPanel = new Panel
        {
            Dock = DockStyle.Top,
            Height = 20,
            BackColor = Color.Transparent
        };

        _lblTitle = new Label
        {
            Text = "🎯 MẪU ĐỊNH DẠNG OUTPUT (OUTPUT FORMAT)",
            Font = AppFonts.SubHeader,
            ForeColor = AppColors.TextSecondary,
            AutoSize = true,
            Location = new Point(0, 0)
        };

        _lblCountBadge = new Label
        {
            Text = "0 mẫu",
            Font = AppFonts.Badge,
            ForeColor = AppColors.PrimaryHover,
            AutoSize = true,
            Location = new Point(_lblTitle.Right + 8, 2)
        };

        headerPanel.Controls.Add(_lblTitle);
        headerPanel.Controls.Add(_lblCountBadge);

        // 2. Dropdown & Navigation Control Container
        var controlPanel = new Panel
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(0, 2, 0, 0),
            BackColor = Color.Transparent
        };

        _btnPrev = new ModernButton
        {
            Text = "◀",
            Size = new Size(32, 28),
            Font = AppFonts.CaptionBold,
            CustomBackColor = AppColors.SurfaceHighlight,
            CustomHoverColor = AppColors.BorderHighlight,
            Dock = DockStyle.Left,
            Margin = new Padding(0, 0, 4, 0)
        };
        _btnPrev.Click += (_, _) => NavigateSchema(-1);

        _btnNext = new ModernButton
        {
            Text = "▶",
            Size = new Size(32, 28),
            Font = AppFonts.CaptionBold,
            CustomBackColor = AppColors.SurfaceHighlight,
            CustomHoverColor = AppColors.BorderHighlight,
            Dock = DockStyle.Right,
            Margin = new Padding(4, 0, 0, 0)
        };
        _btnNext.Click += (_, _) => NavigateSchema(1);

        _cboSchemas = new ComboBox
        {
            Dock = DockStyle.Fill,
            DropDownStyle = ComboBoxStyle.DropDownList,
            DrawMode = DrawMode.OwnerDrawFixed,
            ItemHeight = 24,
            Font = AppFonts.BodyBold,
            BackColor = AppColors.SurfaceInput,
            ForeColor = AppColors.TextPrimary,
            FlatStyle = FlatStyle.Flat
        };
        _cboSchemas.DrawItem += CboSchemas_DrawItem;
        _cboSchemas.SelectedIndexChanged += CboSchemas_SelectedIndexChanged;

        var comboWrapper = new Panel
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(4, 0, 4, 0),
            BackColor = Color.Transparent
        };
        comboWrapper.Controls.Add(_cboSchemas);

        controlPanel.Controls.Add(comboWrapper);
        controlPanel.Controls.Add(_btnPrev);
        controlPanel.Controls.Add(_btnNext);

        Controls.Add(controlPanel);
        Controls.Add(headerPanel);
    }

    public void LoadSchemas(IReadOnlyList<FormatSchema> schemas, string activeSchemaId)
    {
        _isInternalUpdating = true;
        _schemas.Clear();
        _schemas.AddRange(schemas);

        _cboSchemas.Items.Clear();
        var selectedIndex = 0;

        for (var i = 0; i < _schemas.Count; i++)
        {
            var item = _schemas[i];
            _cboSchemas.Items.Add(item);
            if (string.Equals(item.Id, activeSchemaId, StringComparison.OrdinalIgnoreCase))
            {
                selectedIndex = i;
            }
        }

        _lblCountBadge.Text = $"{_schemas.Count} mẫu có sẵn";
        _lblCountBadge.Location = new Point(_lblTitle.Right + 8, 2);

        if (_cboSchemas.Items.Count > 0)
        {
            _cboSchemas.SelectedIndex = selectedIndex;
        }

        _isInternalUpdating = false;
    }

    public void SetActive(string schemaId)
    {
        if (_isInternalUpdating) return;

        for (var i = 0; i < _schemas.Count; i++)
        {
            if (string.Equals(_schemas[i].Id, schemaId, StringComparison.OrdinalIgnoreCase))
            {
                _isInternalUpdating = true;
                _cboSchemas.SelectedIndex = i;
                _isInternalUpdating = false;
                break;
            }
        }
    }

    private void NavigateSchema(int delta)
    {
        if (_schemas.Count == 0) return;
        var nextIndex = _cboSchemas.SelectedIndex + delta;
        if (nextIndex < 0) nextIndex = _schemas.Count - 1;
        if (nextIndex >= _schemas.Count) nextIndex = 0;

        _cboSchemas.SelectedIndex = nextIndex;
    }

    private void CboSchemas_SelectedIndexChanged(object? sender, EventArgs e)
    {
        if (_isInternalUpdating) return;

        if (_cboSchemas.SelectedItem is FormatSchema selectedSchema)
        {
            SchemaSelected?.Invoke(selectedSchema.Id);
        }
    }

    private void CboSchemas_DrawItem(object? sender, DrawItemEventArgs e)
    {
        if (e.Index < 0 || e.Index >= _schemas.Count) return;

        var schema = _schemas[e.Index];
        var isSelected = (e.State & DrawItemState.Selected) == DrawItemState.Selected;

        var bgBrush = new SolidBrush(isSelected ? AppColors.Primary : AppColors.SurfaceInput);
        var textBrush = new SolidBrush(isSelected ? Color.White : AppColors.TextPrimary);
        var descBrush = new SolidBrush(isSelected ? Color.FromArgb(224, 231, 255) : AppColors.TextMuted);

        e.Graphics.FillRectangle(bgBrush, e.Bounds);

        var titleText = $"{schema.Icon} {schema.Name}";
        var titleFont = AppFonts.BodyBold;
        var descFont = AppFonts.Caption;

        var titleSize = e.Graphics.MeasureString(titleText, titleFont);
        var textY = e.Bounds.Y + (e.Bounds.Height - (int)titleSize.Height) / 2;

        e.Graphics.DrawString(titleText, titleFont, textBrush, e.Bounds.X + 6, textY);

        if (!string.IsNullOrWhiteSpace(schema.Description))
        {
            var descX = e.Bounds.X + (int)titleSize.Width + 12;
            if (descX < e.Bounds.Right - 20)
            {
                var descRect = new RectangleF(descX, textY + 1, e.Bounds.Right - descX - 4, e.Bounds.Height);
                e.Graphics.DrawString($"— {schema.Description}", descFont, descBrush, descRect);
            }
        }

        e.DrawFocusRectangle();
    }
}
