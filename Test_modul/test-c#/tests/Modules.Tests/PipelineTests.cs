using ClipboardFilterApp.Contracts;
using ClipboardFilterApp.Modules.CompositeModules;
using ClipboardFilterApp.Modules.SubModules;
using Xunit;

namespace Modules.Tests;

public class PipelineTests
{
    private readonly ClipboardPipelineManager _pipelineManager;

    public PipelineTests()
    {
        FilterOptions options = new FilterOptions();
        List<IClipboardFilter> filters = new()
        {
            new UnicodeSanitizerFilter(),
            new ZaloStickerFilter(),
            new BrandRegexFilter(),
            new CommissionRegexFilter(),
            new UrlSanitizerFilter()
        };

        _pipelineManager = new ClipboardPipelineManager(options, filters);
    }

    [Fact]
    public void Should_Remove_Zalo_Sticker_And_Commission()
    {
        string rawInput = "🌷40% - 6-12m Mã: 🏆 626\n/-rose /-rose Căn đẹp 2PN";
        string expected = "Mã: 🏆 626\nCăn đẹp 2PN";

        string actual = _pipelineManager.Process(rawInput);

        Assert.Equal(expected, actual);
    }

    [Fact]
    public void Should_Remove_Brand_Header_And_Brand_Name()
    {
        string rawInput = "🔥 Nguồn hàng cập nhật liên tục tại\n🏆 TL21House 🏆";
        string expected = "";

        string actual = _pipelineManager.Process(rawInput);

        Assert.Equal(expected, actual);
    }

    [Fact]
    public void Should_Clean_Real_Estate_Post_And_Preserve_Paragraph_Spacing()
    {
        string rawInput =
            "🏆30%-hd toi 30/8/2027 Mã: 652\n" +
            "     \n" +
            "🏢 Địa chỉ: Ngõ 76 Chùa Quỳnh – Quận Hai Bà Trưng\n" +
            "\n" +
            "⌛️ 1/9 Trống: 202\n" +
            "\n" +
            "☘ Giá: 8tr7\n" +
            "☘ Dạng phòng: Studio \n" +
            "☘ Thang: Thang Máy\n" +
            "\n" +
            "🏆 Nội thất:\n" +
            "Full đồ: Điều hòa, nóng lạnh, giường, tủ quần áo, bàn ăn, tủ lạnh, máy giặt riêng, bếp từ, hút mùi, ban công / cửa sổ thoáng. Chỉ việc xách vali đến ở.\n" +
            "\n" +
            "🏆 Dịch vụ:\n" +
            " • Điện: 4k / số\n" +
            " • Nước: 120k / người\n" +
            " • Mạng: 100k / phòng\n" +
            " • DV chung: 150k / người\n" +
            "\n" +
            "⭐ Lưu ý:\n" +
            " • Đóng 1 cọc 1\n" +
            " • Ngõ ô tô: Gần ngõ ô tô\n" +
            "\n" +
            "📍 Vị trí cực đẹp: Gần ĐH Bách Khoa, Kinh Công, Time City, di chuyển thuận tiện.\n" +
            "\n" +
            "🔥 Nguồn hàng cập nhật liên tục tại\n" +
            "🏆 TL21House 🏆";

        string expected =
            "🏆Mã: 652\n" +
            "\n" +
            "🏢 Địa chỉ: Ngõ 76 Chùa Quỳnh – Quận Hai Bà Trưng\n" +
            "\n" +
            "⌛️ 1/9 Trống: 202\n" +
            "\n" +
            "☘ Giá: 8tr7\n" +
            "☘ Dạng phòng: Studio\n" +
            "☘ Thang: Thang Máy\n" +
            "\n" +
            "🏆 Nội thất:\n" +
            "Full đồ: Điều hòa, nóng lạnh, giường, tủ quần áo, bàn ăn, tủ lạnh, máy giặt riêng, bếp từ, hút mùi, ban công / cửa sổ thoáng. Chỉ việc xách vali đến ở.\n" +
            "\n" +
            "🏆 Dịch vụ:\n" +
            "• Điện: 4k / số\n" +
            "• Nước: 120k / người\n" +
            "• Mạng: 100k / phòng\n" +
            "• DV chung: 150k / người\n" +
            "\n" +
            "⭐ Lưu ý:\n" +
            "• Đóng 1 cọc 1\n" +
            "• Ngõ ô tô: Gần ngõ ô tô\n" +
            "\n" +
            "📍 Vị trí cực đẹp: Gần ĐH Bách Khoa, Kinh Công, Time City, di chuyển thuận tiện.";

        string actual = _pipelineManager.Process(rawInput);

        Assert.Equal(expected, actual);
    }
}
