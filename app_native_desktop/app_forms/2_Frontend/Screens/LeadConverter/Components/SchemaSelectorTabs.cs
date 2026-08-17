using AppForms.Backend.Contracts.Entities;
using AppForms.Frontend.Shared.Components;
using AppForms.Frontend.Shared.Theme;
using AppForms.Shared.Enums;

namespace AppForms.Frontend.Screens.LeadConverter.Components;

public class SchemaSelectorTabs : Panel
{
    private readonly ComboBox _cboSchemas;
    private readonly Label _lblTitle;
    private readonly Label _lblCountBadge;
    private readonly Label _lblStatusBadge;
    private readonly ModernButton _btnAddCode;
    private readonly ModernButton _btnPrev;
    private readonly ModernButton _btnNext;
    private readonly List<FormatSchema> _schemas = new();
    private bool _isInternalUpdating;
    private string? _currentRoomCode;
    private string? _currentActiveSchemaId;

    public event Action<string>? SchemaSelected;
    public event Action<string, string>? AddCodeRequested;

    public SchemaSelectorTabs()
    {
        Dock = DockStyle.Top;
        Height = 64;
        Padding = new Padding(8, 4, 8, 6);
        Margin = new Padding(0, 0, 0, 6);
        BackColor = AppColors.SurfaceDark;

        // 1. Header Bar
        var headerPanel = new Panel
        {
            Dock = DockStyle.Top,
            Height = 28,
            BackColor = Color.Transparent
        };

        _lblTitle = new Label
        {
            Text = "🎯 MẪU OUTPUT",
            Font = AppFonts.SubHeader,
            ForeColor = AppColors.TextSecondary,
            AutoSize = true,
            Location = new Point(0, 4)
        };

        _lblCountBadge = new Label
        {
            Text = "0 mẫu",
            Font = AppFonts.Badge,
            ForeColor = AppColors.PrimaryHover,
            AutoSize = true,
            Location = new Point(_lblTitle.Right + 6, 6)
        };

        _lblStatusBadge = new Label
        {
            Text = string.Empty,
            Font = AppFonts.CaptionBold,
            ForeColor = AppColors.Warning,
            AutoSize = true,
            Location = new Point(_lblCountBadge.Right + 8, 5),
            Visible = false
        };

        _btnAddCode = new ModernButton
        {
            Text = "➕ Thêm mã",
            Size = new Size(105, 26),
            Font = AppFonts.CaptionBold,
            CustomBackColor = AppColors.Primary,
            CustomHoverColor = AppColors.PrimaryHover,
            Dock = DockStyle.Right,
            Enabled = false
        };
        _btnAddCode.Click += OnAddCodeClicked;

        headerPanel.Controls.Add(_lblTitle);
        headerPanel.Controls.Add(_lblCountBadge);
        headerPanel.Controls.Add(_lblStatusBadge);
        headerPanel.Controls.Add(_btnAddCode);

        // 2. Dropdown & Navigation Control Container
        var controlPanel = new Panel
        {
            Dock = DockStyle.Fill,
            Padding = new Padding(0, 4, 0, 0),
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

    public void LoadSchemas(IReadOnlyList<FormatSchema> schemas, string? activeSchemaId)
    {
        _isInternalUpdating = true;
        _schemas.Clear();
        _schemas.AddRange(schemas);

        _cboSchemas.Items.Clear();
        var selectedIndex = -1;

        for (var i = 0; i < _schemas.Count; i++)
        {
            var item = _schemas[i];
            _cboSchemas.Items.Add(item);
            if (!string.IsNullOrEmpty(activeSchemaId) && string.Equals(item.Id, activeSchemaId, StringComparison.OrdinalIgnoreCase))
            {
                selectedIndex = i;
            }
        }

        _lblCountBadge.Text = $"{_schemas.Count} mẫu";
        _lblCountBadge.Location = new Point(_lblTitle.Right + 6, 6);

        _cboSchemas.SelectedIndex = selectedIndex;
        _currentActiveSchemaId = activeSchemaId;

        _isInternalUpdating = false;
    }

    public void SetActive(string? schemaId)
    {
        _currentActiveSchemaId = schemaId;
        if (_isInternalUpdating) return;

        _isInternalUpdating = true;
        if (string.IsNullOrEmpty(schemaId))
        {
            _cboSchemas.SelectedIndex = -1;
        }
        else
        {
            for (var i = 0; i < _schemas.Count; i++)
            {
                if (string.Equals(_schemas[i].Id, schemaId, StringComparison.OrdinalIgnoreCase))
                {
                    _cboSchemas.SelectedIndex = i;
                    break;
                }
            }
        }
        _isInternalUpdating = false;
    }

    public void SetAddCodeState(bool enabled, string? roomCode, string? schemaId)
    {
        _currentRoomCode = roomCode;
        _btnAddCode.Enabled = enabled && !string.IsNullOrWhiteSpace(roomCode) && !string.IsNullOrWhiteSpace(schemaId);
    }

    public void SetDetectionStatus(SchemaDetectionStatus status, string? conflictMessage = null, IReadOnlyList<string>? candidateNames = null)
    {
        switch (status)
        {
            case SchemaDetectionStatus.AmbiguousConflict:
                _lblStatusBadge.Visible = true;
                _lblStatusBadge.ForeColor = AppColors.Warning;
                _lblStatusBadge.Text = "⚠️ Trùng mã giữa nhiều sàn";
                break;
            case SchemaDetectionStatus.NotFound:
                _lblStatusBadge.Visible = true;
                _lblStatusBadge.ForeColor = AppColors.TextMuted;
                _lblStatusBadge.Text = "❓ Chưa nhận diện sàn";
                break;
            case SchemaDetectionStatus.ExactMatch:
                _lblStatusBadge.Visible = true;
                _lblStatusBadge.ForeColor = AppColors.Success;
                _lblStatusBadge.Text = "⚡ Tự động nhận diện";
                break;
            case SchemaDetectionStatus.ManualSelected:
                _lblStatusBadge.Visible = false;
                _lblStatusBadge.Text = string.Empty;
                break;
            default:
                _lblStatusBadge.Visible = false;
                _lblStatusBadge.Text = string.Empty;
                break;
        }

        _lblStatusBadge.Location = new Point(_lblCountBadge.Right + 8, 5);
    }

    private void OnAddCodeClicked(object? sender, EventArgs e)
    {
        if (string.IsNullOrWhiteSpace(_currentRoomCode) || string.IsNullOrWhiteSpace(_currentActiveSchemaId))
        {
            return;
        }

        AddCodeRequested?.Invoke(_currentActiveSchemaId, _currentRoomCode);
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

        if (_cboSchemas.SelectedIndex >= 0 && _cboSchemas.SelectedItem is FormatSchema selectedSchema)
        {
            _currentActiveSchemaId = selectedSchema.Id;
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
