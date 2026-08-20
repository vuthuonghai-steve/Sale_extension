using AppForms.Frontend.Shared.Components;
using AppForms.Frontend.Shared.Theme;
using AppForms.Shared.Models.MessageFilter;

namespace AppForms.Frontend.Screens.MessageFilter.Components;

public class PipelineExecutionLogComponent : Panel
{
    private ListView _lvLogs = null!;
    private ModernButton _btnClearLogs = null!;
    private readonly List<FilterExecutionReport> _reports = new();

    public event Action<FilterExecutionReport>? LogSelected;
    public event Action? ClearLogsRequested;

    public PipelineExecutionLogComponent()
    {
        InitializeUI();
    }

    private void InitializeUI()
    {
        Dock = DockStyle.Bottom;
        Height = 150;
        BackColor = AppColors.SurfaceDark;
        Padding = new Padding(10, 4, 10, 6);

        var pnlHeader = new Panel { Dock = DockStyle.Top, Height = 24, BackColor = Color.Transparent };
        var lblHeader = new Label { Text = "📜 LỊCH SỬ LỌC CLIPBOARD THỜI GIAN THỰC:", Font = AppFonts.CaptionBold, ForeColor = AppColors.TextSecondary, AutoSize = true, Location = new Point(0, 3) };

        _btnClearLogs = new ModernButton { Text = "🗑️ Xóa log", Size = new Size(65, 20), Font = AppFonts.Badge, CustomBackColor = AppColors.SurfaceHighlight, Anchor = AnchorStyles.Top | AnchorStyles.Right, Location = new Point(pnlHeader.Width - 70, 1) };
        _btnClearLogs.Click += (_, _) =>
        {
            _reports.Clear();
            _lvLogs.Items.Clear();
            ClearLogsRequested?.Invoke();
        };

        pnlHeader.Controls.Add(lblHeader);
        pnlHeader.Controls.Add(_btnClearLogs);

        _lvLogs = new ListView
        {
            Dock = DockStyle.Fill,
            View = View.Details,
            FullRowSelect = true,
            GridLines = true,
            HeaderStyle = ColumnHeaderStyle.Nonclickable,
            BackColor = AppColors.SurfaceInput,
            ForeColor = AppColors.TextPrimary,
            Font = AppFonts.Badge,
            BorderStyle = BorderStyle.None
        };

        _lvLogs.Columns.Add("Thời gian", 65, HorizontalAlignment.Left);
        _lvLogs.Columns.Add("Thay đổi", 75, HorizontalAlignment.Center);
        _lvLogs.Columns.Add("Độ dài (Gốc➔Sạch)", 110, HorizontalAlignment.Left);
        _lvLogs.Columns.Add("Bộ lọc áp dụng", 140, HorizontalAlignment.Left);

        _lvLogs.SelectedIndexChanged += (_, _) =>
        {
            if (_lvLogs.SelectedIndices.Count > 0)
            {
                int index = _lvLogs.SelectedIndices[0];
                if (index >= 0 && index < _reports.Count)
                {
                    LogSelected?.Invoke(_reports[index]);
                }
            }
        };

        Controls.Add(_lvLogs);
        Controls.Add(pnlHeader);
    }

    public void AddReport(FilterExecutionReport report)
    {
        _reports.Insert(0, report);
        if (_reports.Count > 100)
        {
            _reports.RemoveAt(_reports.Count - 1);
        }

        var item = new ListViewItem(report.Timestamp.ToString("HH:mm:ss"))
        {
            ForeColor = report.IsModified ? AppColors.Success : AppColors.TextMuted
        };

        item.SubItems.Add(report.IsModified ? "ĐÃ LỌC" : "KHÔNG ĐỔI");
        item.SubItems.Add($"{report.RawText.Length} ➔ {report.CleanedText.Length}");
        item.SubItems.Add(report.AppliedFilters.Count > 0 ? string.Join(", ", report.AppliedFilters) : "Không");

        _lvLogs.Items.Insert(0, item);
        if (_lvLogs.Items.Count > 100)
        {
            _lvLogs.Items.RemoveAt(_lvLogs.Items.Count - 1);
        }
    }
}
