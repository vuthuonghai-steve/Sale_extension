using AppForms.Shared.Models.MessageFilter;

namespace AppForms.Backend.Contracts.Interfaces;

/// <summary>
/// Giao diện điều phối động cơ Pipeline lọc Clipboard tự động toàn hệ thống
/// </summary>
public interface IFilterPipelineOrchestrator
{
    /// <summary>
    /// Trạng thái đang hoạt động của dịch vụ lọc Clipboard
    /// </summary>
    bool IsRunning { get; }

    /// <summary>
    /// Cấu hình hiện tại của Pipeline
    /// </summary>
    FilterPipelineOptions CurrentOptions { get; }

    /// <summary>
    /// Sự kiện bắn ra khi một chuỗi văn bản Clipboard được xử lý thành công
    /// </summary>
    event EventHandler<FilterExecutionReport>? PayloadProcessed;

    /// <summary>
    /// Sự kiện trạng thái hoạt động thay đổi
    /// </summary>
    event EventHandler<bool>? StateChanged;

    /// <summary>
    /// Xử lý trực tiếp văn bản thô theo cấu hình Pipeline hiện hành mà không cần qua Clipboard OS
    /// </summary>
    FilterExecutionReport ProcessManual(string rawText);

    /// <summary>
    /// Cập nhật tùy chọn cấu hình của Pipeline
    /// </summary>
    void UpdateOptions(FilterPipelineOptions options);

    /// <summary>
    /// Bật dịch vụ lắng nghe và lọc tự động
    /// </summary>
    void Start();

    /// <summary>
    /// Tạm dừng dịch vụ lắng nghe và lọc tự động
    /// </summary>
    void Stop();
}
