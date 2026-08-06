namespace ClipboardFilterApp.Contracts;

/// <summary>
/// Cấu hình cài đặt bật/tắt các bộ lọc trong hệ thống
/// </summary>
public class FilterOptions
{
    /// <summary>
    /// Trạng thái Bật/Tắt toàn bộ dịch vụ lọc OS Clipboard
    /// </summary>
    public bool EnableService { get; set; } = true;

    public bool EnableUnicodeSanitizer { get; set; } = true;
    public bool EnableZaloStickerFilter { get; set; } = true;
    public bool EnableCommissionFilter { get; set; } = true;
    public bool EnableUrlSanitizer { get; set; } = true;
    public int MaxPayloadCharacterLimit { get; set; } = 100_000;
}
