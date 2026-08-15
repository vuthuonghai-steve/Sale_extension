using AppForms.Frontend.Shared.Theme;
using Serilog;

namespace AppForms.Frontend.Screens.Settings.Components;

/// <summary>
/// Sub-Component: Card hiển thị danh sách mã phòng dạng Chip và thanh tìm kiếm
/// </summary>
public class RoomCodeListCard : Panel
{
    private static readonly ILogger _logger = Log.ForContext<RoomCodeListCard>();

    private Label _lblGroupStats = null!;
    private TextBox _txtSearch = null!;
    private FlowLayoutPanel _flowCodes = null!;

    private string _currentSchemaId = string.Empty;
    private string _currentDisplayName = string.Empty;
    private List<string> _allCodes = new();
    private string _filterQuery = string.Empty;

    public event Action<string, string>? RemoveCodeRequested; // (schemaId, code)

    public RoomCodeListCard()
    {
        InitializeUI();
        _logger.Debug("RoomCodeListCard đã khởi tạo thành công.");
    }

    private void InitializeUI()
    {
        Dock = DockStyle.Fill;
        BackColor = AppColors.SurfaceDark;
        Padding = new Padding(12);
        MinimumSize = new Size(0, 260);

        var listHeader = new Panel
        {
            Dock = DockStyle.Top,
            Height = 56,
            Padding = new Padding(0, 0, 0, 6)
        };

        _lblGroupStats = new Label
        {
            Text = "📋 Danh sách mã hiện tại (0 mã):",
            Font = AppFonts.SubHeader,
            ForeColor = AppColors.TextPrimary,
            Dock = DockStyle.Top,
            Height = 22
        };

        _txtSearch = new TextBox
        {
            Dock = DockStyle.Top,
            Font = AppFonts.Body,
            BackColor = AppColors.SurfaceInput,
            ForeColor = AppColors.TextPrimary,
            BorderStyle = BorderStyle.FixedSingle,
            PlaceholderText = "🔍 Tìm kiếm mã trong sàn..."
        };
        _txtSearch.TextChanged += (_, _) =>
        {
            _filterQuery = _txtSearch.Text.Trim();
            _logger.Debug("Tìm kiếm mã phòng: Từ khóa='{Query}', Schema={SchemaId}", _filterQuery, _currentSchemaId);
            RefreshChipList();
        };

        listHeader.Controls.Add(_txtSearch);
        listHeader.Controls.Add(_lblGroupStats);

        _flowCodes = new FlowLayoutPanel
        {
            Dock = DockStyle.Fill,
            AutoScroll = true,
            WrapContents = true,
            BackColor = AppColors.SurfaceInput,
            Padding = new Padding(6),
            BorderStyle = BorderStyle.None
        };

        Controls.Add(_flowCodes);
        Controls.Add(listHeader);
    }

    public void RenderCodes(string schemaId, string displayName, List<string> codes)
    {
        _currentSchemaId = schemaId;
        _currentDisplayName = displayName;
        _allCodes = codes;

        _lblGroupStats.Text = $"📋 Danh sách mã của {displayName} ({codes.Count} mã):";
        _logger.Debug("RenderCodes: Schema={SchemaId}, Tên sàn={DisplayName}, Số mã={Count}", schemaId, displayName, codes.Count);
        RefreshChipList();
    }

    public void ResetSearch()
    {
        _logger.Debug("ResetSearch: Xóa bộ lọc tìm kiếm cho Schema={SchemaId}", _currentSchemaId);
        _txtSearch.Text = string.Empty;
        _filterQuery = string.Empty;
    }

    private void RefreshChipList()
    {
        _flowCodes.SuspendLayout();
        _flowCodes.Controls.Clear();

        if (_allCodes.Count == 0)
        {
            _logger.Debug("RefreshChipList: Không có mã nào trong kho cho {SchemaId}", _currentSchemaId);
            var lblEmpty = new Label
            {
                Text = "Chưa có mã phòng nào cho sàn này.",
                Font = AppFonts.Caption,
                ForeColor = AppColors.TextMuted,
                AutoSize = true,
                Padding = new Padding(8)
            };
            _flowCodes.Controls.Add(lblEmpty);
            _flowCodes.ResumeLayout();
            return;
        }

        var filteredCodes = _allCodes
            .Where(c => string.IsNullOrEmpty(_filterQuery) || c.Contains(_filterQuery, StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (filteredCodes.Count == 0)
        {
            _logger.Debug("RefreshChipList: Không có mã nào khớp với từ khóa='{FilterQuery}' (Tổng số mã: {Total})", _filterQuery, _allCodes.Count);
            var lblNoMatch = new Label
            {
                Text = $"Không tìm thấy mã nào khớp với '{_filterQuery}'",
                Font = AppFonts.Caption,
                ForeColor = AppColors.TextMuted,
                AutoSize = true,
                Padding = new Padding(8)
            };
            _flowCodes.Controls.Add(lblNoMatch);
            _flowCodes.ResumeLayout();
            return;
        }

        _logger.Debug("RefreshChipList: Đang hiển thị {FilteredCount}/{TotalCount} chip mã cho {SchemaId}", filteredCodes.Count, _allCodes.Count, _currentSchemaId);

        foreach (var code in filteredCodes)
        {
            var chip = new RoomCodeChip(_currentSchemaId, code);
            chip.DeleteClicked += (sid, c) =>
            {
                _logger.Information("Sự kiện xóa mã chip: Schema={SchemaId}, Code={Code}", sid, c);
                RemoveCodeRequested?.Invoke(sid, c);
            };
            _flowCodes.Controls.Add(chip);
        }

        _flowCodes.ResumeLayout();
    }
}

