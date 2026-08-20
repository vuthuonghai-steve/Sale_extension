namespace AppForms.Shared.Models.MessageFilter;

/// <summary>
/// Cấu hình cài đặt bật/tắt các bộ lọc trong hệ thống
/// </summary>
public class FilterPipelineOptions
{
    /// <summary>
    /// Trạng thái Bật/Tắt toàn bộ dịch vụ lọc OS Clipboard
    /// </summary>
    public bool EnableService { get; set; } = true;

    /// <summary>
    /// Bật/Tắt bộ lọc chuẩn hóa Unicode (Form C, loại bỏ ký tự ẩn/BOM/Zero-width space)
    /// </summary>
    public bool EnableUnicodeSanitizer { get; set; } = true;

    /// <summary>
    /// Bật/Tắt bộ lọc header trích dẫn reply quote Zalo
    /// </summary>
    public bool EnableReplyQuoteFilter { get; set; } = true;

    /// <summary>
    /// Bật/Tắt bộ lọc sticker Zalo và tag hệ thống [Hình ảnh], [File]...
    /// </summary>
    public bool EnableZaloStickerFilter { get; set; } = true;

    /// <summary>
    /// Bật/Tắt bộ lọc thương hiệu và nguồn hàng (TL House...)
    /// </summary>
    public bool EnableBrandFilter { get; set; } = true;

    /// <summary>
    /// Bật/Tắt bộ lọc hoa hồng, phí môi giới, thưởng sale
    /// </summary>
    public bool EnableCommissionFilter { get; set; } = true;

    /// <summary>
    /// Bật/Tắt bộ lọc URL tracking (utm_*, fbclid...)
    /// </summary>
    public bool EnableUrlSanitizer { get; set; } = true;

    /// <summary>
    /// Giới hạn số ký tự tối đa của một payload copy để tránh treo app khi copy file dung lượng cực lớn
    /// </summary>
    public int MaxPayloadCharacterLimit { get; set; } = 100_000;
}
