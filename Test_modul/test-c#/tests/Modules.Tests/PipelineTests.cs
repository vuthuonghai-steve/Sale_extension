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
            new ReplyQuoteFilter(),
            new ZaloStickerFilter(),
            new BrandRegexFilter(),
            new CommissionRegexFilter(),
            new UrlSanitizerFilter()
        };

        _pipelineManager = new ClipboardPipelineManager(options, filters);
    }

    [Fact]
    public void TC01_COMMISSION_BEFORE_TROPHY_NO_MA()
    {
        string input = "🌷 40%-12m 🏆 032\n\n🏢 Địa chỉ: Số 15 ngõ 42 Yên Hoà\nQuận: Cầu Giấy\n\n⌛️ Trống: \n\n☘ Giá: 6tr2-p601-604\n              6tr4-p702\n☘ Dạng phòng: STUDIO\n☘ Thang: Thang máy + tha";
        string expected = "🏆 032\n\n🏢 Địa chỉ: Số 15 ngõ 42 Yên Hoà\nQuận: Cầu Giấy\n\n⌛️ Trống:\n\n☘ Giá: 6tr2-p601-604\n 6tr4-p702\n☘ Dạng phòng: STUDIO\n☘ Thang: Thang máy + tha";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC02_COMMISSION_PERCENT_BEFORE_MA()
    {
        string input = "🌷30% 6-12m Mã: 🏆 918\n\n🏢 Địa chỉ: Số 10 ngõ 80 Chùa Láng\nQuận: Đống Đa\n\n☘ Giá: 5tr5 - p302\n☘ Dạng phòng: 1N1K";
        string expected = "Mã: 🏆 918\n\n🏢 Địa chỉ: Số 10 ngõ 80 Chùa Láng\nQuận: Đống Đa\n\n☘ Giá: 5tr5 - p302\n☘ Dạng phòng: 1N1K";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC03_MULTI_SEGMENT_BEFORE_MA()
    {
        string input = "🌷 40%- 12th | 30%- 6th Mã: 🏆 379\n🏢 Địa chỉ: 52 Mỹ Đình\nQuận: Nam Từ Liêm\n☘ Giá: 4tr5 - p201";
        string expected = "Mã: 🏆 379\n🏢 Địa chỉ: 52 Mỹ Đình\nQuận: Nam Từ Liêm\n☘ Giá: 4tr5 - p201";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC04_NOTE_BRACKET_CHU_DAN()
    {
        string input = "🌷40% - 12m ( Chủ dẫn 30% -12M) Mã: 🏆 232\n🏢 Địa chỉ: 18 Khương Đình\nQuận: Thanh Xuân";
        string expected = "Mã: 🏆 232\n🏢 Địa chỉ: 18 Khương Đình\nQuận: Thanh Xuân";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC05_MONEY_COMMISSION_BEFORE_MA()
    {
        string input = "🌷1tr1 - 6-12m Mã: 🏆 626\n🏢 Địa chỉ: 25 Quan Hoa\nQuận: Cầu Giấy";
        string expected = "Mã: 🏆 626\n🏢 Địa chỉ: 25 Quan Hoa\nQuận: Cầu Giấy";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC06_CONTRACT_DATE_LONG()
    {
        string input = "🌷35%-hd 31/8/2027 Mã: 🏆 119\n🏢 Địa chỉ: 99 Cầu Giấy\nQuận: Cầu Giấy";
        string expected = "Mã: 🏆 119\n🏢 Địa chỉ: 99 Cầu Giấy\nQuận: Cầu Giấy";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC07_CONTRACT_DATE_WITH_TOI()
    {
        string input = "🌷40% - hd toi 30/8/2027 Mã: 🏆 982\n🏢 Địa chỉ: 120 Hoàng Quốc Việt\nQuận: Cầu Giấy";
        string expected = "Mã: 🏆 982\n🏢 Địa chỉ: 120 Hoàng Quốc Việt\nQuận: Cầu Giấy";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC08_TEXT_EMOJI_ROSE()
    {
        string input = "/-rose 35% Mã 801\n🏢 Địa chỉ: 88 Trần Duy Hưng\nQuận: Cầu Giấy";
        string expected = "Mã 801\n🏢 Địa chỉ: 88 Trần Duy Hưng\nQuận: Cầu Giấy";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC09_STANDALONE_LINE_PERCENT_EMOJI()
    {
        string input = "🌷40% - 6-12m\n🏢 Địa chỉ: 15 Trung Kính\nQuận: Cầu Giấy\n☘ Giá: 5tr";
        string expected = "🏢 Địa chỉ: 15 Trung Kính\nQuận: Cầu Giấy\n☘ Giá: 5tr";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC10_STANDALONE_LINE_PERCENT_NO_EMOJI()
    {
        string input = "30%-6th\n🏢 Địa chỉ: 30 Dịch Vọng\nQuận: Cầu Giấy";
        string expected = "🏢 Địa chỉ: 30 Dịch Vọng\nQuận: Cầu Giấy";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC11_STANDALONE_LINE_NOTE_BRACKET()
    {
        string input = "(Chốt đúng giá, fix giá hh 30%)\n🏢 Địa chỉ: 45 Lê Đức Thọ\nQuận: Nam Từ Liêm";
        string expected = "🏢 Địa chỉ: 45 Lê Đức Thọ\nQuận: Nam Từ Liêm";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC12_ORPHAN_EMOJI_BEFORE_MA()
    {
        string input = "🌷 Mã: 🏆 063\n🏢 Địa chỉ: 72 Nguyễn Khang\nQuận: Cầu Giấy";
        string expected = "Mã: 🏆 063\n🏢 Địa chỉ: 72 Nguyễn Khang\nQuận: Cầu Giấy";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC13_ORPHAN_EMOJI_BEFORE_TROPHY()
    {
        string input = "🌷 🏆 063\n🏢 Địa chỉ: 72 Nguyễn Khang\nQuận: Cầu Giấy";
        string expected = "🏆 063\n🏢 Địa chỉ: 72 Nguyễn Khang\nQuận: Cầu Giấy";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC14_BRAND_REMOVAL()
    {
        string input = "• Nguồn hàng cập nhật liên tục tại 🏆TL21House🏆\n🏢 Địa chỉ: 18 Nguyễn Cơ Thạch\nQuận: Nam Từ Liêm";
        string expected = "🏢 Địa chỉ: 18 Nguyễn Cơ Thạch\nQuận: Nam Từ Liêm";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC15_PRESERVE_PRICE_LINES()
    {
        string input = "🏢 Địa chỉ: Số 15 ngõ 42 Yên Hoà\nQuận: Cầu Giấy\n\n⌛️ Trống: \n\n☘ Giá: 6tr2-p601-604\n              6tr4-p702\n☘ Dạng phòng: STUDIO\n☘ Thang: Thang máy + tha";
        string expected = "🏢 Địa chỉ: Số 15 ngõ 42 Yên Hoà\nQuận: Cầu Giấy\n\n⌛️ Trống:\n\n☘ Giá: 6tr2-p601-604\n 6tr4-p702\n☘ Dạng phòng: STUDIO\n☘ Thang: Thang máy + tha";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC16_COMMISSION_UNDERSCORE_CTV_CHU_DAN_BEFORE_MA()
    {
        string input = "🌷40%_12th ( ctv dẫn)\n      30%_12th  ( Chủ dẫn)     Mã: 🏆 \n\nĐịa chỉ : 91 ngõ 44 TRẦN THÁI TÔNG (đi ngõ 36 dịch vọng hậu vào nhà được), Cầu Giấy\n\n\n⌛️ Trống : 402";
        string expected = "Mã: 🏆\n\nĐịa chỉ : 91 ngõ 44 TRẦN THÁI TÔNG (đi ngõ 36 dịch vọng hậu vào nhà được), Cầu Giấy\n\n⌛️ Trống : 402";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC17_COMMISSION_UNDERSCORE_STANDALONE()
    {
        string input = "🌷40%_12th ( ctv dẫn)\n🏢 Địa chỉ: 91 Trần Thái Tông\n☘ Giá: 4tr";
        string expected = "🏢 Địa chỉ: 91 Trần Thái Tông\n☘ Giá: 4tr";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC18_COMMISSION_UNDERSCORE_BEFORE_TROPHY_NO_MA()
    {
        string input = "🌷40%_12th ( ctv dẫn)\n      30%_12th  ( Chủ dẫn)     🏆 044\n\n🏢 Địa chỉ: 91 Trần Thái Tông";
        string expected = "🏆 044\n\n🏢 Địa chỉ: 91 Trần Thái Tông";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC19_FULL_MESSAGE_UNDERSCORE_TLHOUSE()
    {
        string input = "🌷40%_12th ( ctv dẫn)\n      30%_12th  ( Chủ dẫn)     Mã: 🏆 \n\nĐịa chỉ : 91 ngõ 44 TRẦN THÁI TÔNG (đi ngõ 36 dịch vọng hậu vào nhà được), Cầu Giấy\n\n\n⌛️ Trống : 402\n\n☘Giá : 5tr6 \n☘Dạng phòng : studio giường tầng\n☘Thang : Máy\n\n🏆Nội thất : Điều hoà, nóng lạnh, gường, tủ quần áo, tủ bếp, máy giặt Riêng, Tủ Lạnh,...\n\n🏆Dịch vụ :Điện 4k/số\nNước: 38k/khối \nWifi : 100k 1p\nDvc :190k/người \n\n ⭐Lưu ý: \n-ô tô cách nhà 50m\n-3ng2xe\n-Không pet\n- Đóng 1 cọc 1\n- Nguồn hàng cập nhật liên tục tại         \n                🏆TL21House🏆";
        string expected = "Mã: 🏆\n\nĐịa chỉ : 91 ngõ 44 TRẦN THÁI TÔNG (đi ngõ 36 dịch vọng hậu vào nhà được), Cầu Giấy\n\n⌛️ Trống : 402\n\n☘Giá : 5tr6\n☘Dạng phòng : studio giường tầng\n☘Thang : Máy\n\n🏆Nội thất : Điều hoà, nóng lạnh, gường, tủ quần áo, tủ bếp, máy giặt Riêng, Tủ Lạnh,...\n\n🏆Dịch vụ :Điện 4k/số\nNước: 38k/khối\nWifi : 100k 1p\nDvc :190k/người\n\n ⭐Lưu ý:\n-ô tô cách nhà 50m\n-3ng2xe\n-Không pet\n- Đóng 1 cọc 1";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC20_COMMISSION_MULTI_SEGMENT_SAME_LINE_SPACES()
    {
        string input = "🌷40%_12th ( ctv dẫn)       30%_12th  ( Chủ dẫn)     Mã: 🏆\n\nĐịa chỉ : 91 ngõ 44 TRẦN THÁI TÔNG";
        string expected = "Mã: 🏆\n\nĐịa chỉ : 91 ngõ 44 TRẦN THÁI TÔNG";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC21_COMMISSION_BRACKET_NOTE_DIRECTLY_BEFORE_MA()
    {
        string input = "🌷40%_12th ( ctv dẫn) Mã: 🏆\n\nĐịa chỉ : 91 ngõ 44 TRẦN THÁI TÔNG";
        string expected = "Mã: 🏆\n\nĐịa chỉ : 91 ngõ 44 TRẦN THÁI TÔNG";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC22_BONUS_POLICY_HEADER_WITH_COMMISSION_AND_BRAND()
    {
        string input = "GIỮ PHÒNG ĐẾN HẾT THÁNG 8 NẾU KHÁCH CHỐT ĐÚNG GIÁ. CÓ FIX GIÁ CHO KHÁCH CHUYỂN VÀO Ở LUÔN HOẶC THƯỞNG SALE 500K/PHÒNG NẾU KHÁCH CHỐT ĐÚNG GIÁ VÀ CHUYỂN VÀO TRƯỚC 15/8\n\n🌷30%- 12m Mã: 🏆011\n\n🏢Địa chỉ : nhà số 11D ngách 7 ngõ 101 Thanh Nhàn-Hai Bà Trưng\n\n⌛️Trống : \n\n☘Giá : 4tr3-p101      \n☘Dạng phòng studio\n☘Thang : bộ\n\n🏆Nội thất :Điều hòa, nóng lạnh, tủ lạnh, kệ tủ bếp hút mùi, giường tủ quần áo, sofa\n\n🏆Dịch vụ : Điện: 4k/ số Nước: 120k/ người Internet: 100k/ phòng Phí dịch vụ: 120k/người/tháng (máy giặt, dọn vs, điện chung, rác...)\n\n ⭐Lưu ý: \n- Đóng 1 cọc 1\n- Giới hạn 3 xe/phòng\n- PET : ko \n- k nuoc ngoài\n- KO NHẬN XE ĐIỆN  \n- Nguồn hàng cập nhật liên tục tại         \n                🏆TL21House🏆";
        string expected = "Mã: 🏆011\n\n🏢Địa chỉ : nhà số 11D ngách 7 ngõ 101 Thanh Nhàn-Hai Bà Trưng\n\n⌛️Trống :\n\n☘Giá : 4tr3-p101\n☘Dạng phòng studio\n☘Thang : bộ\n\n🏆Nội thất :Điều hòa, nóng lạnh, tủ lạnh, kệ tủ bếp hút mùi, giường tủ quần áo, sofa\n\n🏆Dịch vụ : Điện: 4k/ số Nước: 120k/ người Internet: 100k/ phòng Phí dịch vụ: 120k/người/tháng (máy giặt, dọn vs, điện chung, rác...)\n\n ⭐Lưu ý:\n- Đóng 1 cọc 1\n- Giới hạn 3 xe/phòng\n- PET : ko\n- k nuoc ngoài\n- KO NHẬN XE ĐIỆN";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC23_STANDALONE_BONUS_LINE_VARIATIONS()
    {
        string input = "THƯỞNG SALE 500K/PHÒNG NẾU KHÁCH CHỐT ĐÚNG GIÁ VÀ CHUYỂN VÀO TRƯỚC 15/8\n\n🌷30%- 12m Mã: 🏆011\n🏢Địa chỉ : 11D Thanh Nhàn";
        string expected = "Mã: 🏆011\n🏢Địa chỉ : 11D Thanh Nhàn";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC24_INLINE_BONUS_NOTE_BEFORE_MA()
    {
        string input = "🌷30%- 12m + thưởng sale 500k Mã: 🏆011\n🏢Địa chỉ : 11D Thanh Nhàn";
        string expected = "Mã: 🏆011\n🏢Địa chỉ : 11D Thanh Nhàn";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void TC25_COMMISSION_PERCENT_SPACE_DURATION_BEFORE_MA()
    {
        string input = "🌷20%- 12m Mã: 🏆 366\n\n🏢Địa chỉ : 561 Trương Định (A) - Quận Hoàng Mai\n\n⌛️Trống : 1/9\n\n☘Giá : 5tr7-p702\n              4tr2-p701\n             5tr6-p302,402,602\n             5tr4-p202\n☘Dạng phòng : Studio 25m² (Ban công)\n☘Thang : Thang máy";
        string expected = "Mã: 🏆 366\n\n🏢Địa chỉ : 561 Trương Định (A) - Quận Hoàng Mai\n\n⌛️Trống : 1/9\n\n☘Giá : 5tr7-p702\n 4tr2-p701\n 5tr6-p302,402,602\n 5tr4-p202\n☘Dạng phòng : Studio 25m² (Ban công)\n☘Thang : Thang máy";

        string actual = _pipelineManager.Process(input);
        Assert.Equal(expected, actual);
    }
}
