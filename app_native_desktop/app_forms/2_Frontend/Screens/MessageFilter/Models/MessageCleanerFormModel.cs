using AppForms.Shared.Models.MessageFilter;

namespace AppForms.Frontend.Screens.MessageFilter.Models;

public class MessageCleanerViewModel
{
    public bool IsServiceActive { get; set; } = true;
    public FilterPipelineOptions Options { get; set; } = new();
    public List<FilterExecutionReport> ExecutionLogs { get; set; } = new();
    public string RawPreviewText { get; set; } = string.Empty;
    public string CleanedPreviewText { get; set; } = string.Empty;
}
