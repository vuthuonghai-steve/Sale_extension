using AppForms.Backend.Contracts.Entities;

namespace AppForms.Backend.Contracts.Schemas;

public static class DefaultSchemas
{
    public static readonly FormatSchema ASkyGroup = new()
    {
        Id = "a_sky_group",
        Name = "A Sky Group",
        Icon = "❤️",
        Description = "Định dạng gửi tin nhắn cho team A Sky Group",
        HeaderTemplate = "❤️ A Sky Group ❤️",
        FooterTemplate = "",
        DefaultValues = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["salesName"] = "Thiên Ngọc"
        },
        Fields = new List<FormatField>
        {
            new() { Key = "salesName", Label = "Tên CTV", Prefix = "👉 Tên CTV: ", Required = false },
            new() { Key = "address", Label = "Địa chỉ phòng", Prefix = "👉 Địa chỉ phòng: ", Required = true },
            new() { Key = "roomCode", Label = "Mã phòng", Prefix = "👉  Mã phòng: ", Required = false },
            new() { Key = "price", Label = "Giá phòng", Prefix = "👉 Giá phòng: ", Required = true },
            new() { Key = "viewTime", Label = "Ngày, giờ xem", Prefix = "👉 Ngày, giờ xem: ", Required = false },
            new() { Key = "customerName", Label = "Tên KH (FB/Zalo)", Prefix = "👉 Tên KH (FB/Zalo): ", FallbackTo = "customerPhone", Required = false },
            new() { Key = "customerPhone", Label = "SDT khách", Prefix = "👉 SDT khách: ", Required = true }
        }
    };

    public static readonly FormatSchema TL21House = new()
    {
        Id = "tl21_house",
        Name = "TL21House",
        Icon = "🏆",
        Description = "Định dạng gửi tin nhắn cho team TL21House",
        HeaderTemplate = "🏆TL21House🏆",
        FooterTemplate = "",
        DefaultValues = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["salesName"] = "Thiên Ngọc"
        },
        Fields = new List<FormatField>
        {
            new() { Key = "address", Label = "Địa chỉ", Prefix = "☘️Địa chỉ : ", Required = true },
            new() { Key = "price", Label = "Giá", Prefix = "☘️Giá : ", Required = true },
            new() { Key = "customerPhone", Label = "Sdt khách", Prefix = "☘️Sdt khách : ", Required = true },
            new() { Key = "viewTime", Label = "Thời gian xem", Prefix = "☘️Thời gian xem : ", Required = false },
            new() { Key = "salesName", Label = "CTV", Prefix = "☘️CTV : ", Required = false },
            new() { Key = "roomCode", Label = "MÃ PHÒNG", Prefix = "☘️MÃ PHÒNG : ", Required = false }
        }
    };

    public static readonly FormatSchema TNRHome = new()
    {
        Id = "tnr_home",
        Name = "TNR HOME",
        Icon = "💛",
        Description = "Định dạng gửi tin nhắn cho team TNR HOME",
        HeaderTemplate = "💛 TNR HOME 🌻",
        FooterTemplate = "*Cảm ơn Anh/Chị đã dẫn khách giúp em*",
        DefaultValues = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["salesName"] = "Thiên Ngọc"
        },
        Fields = new List<FormatField>
        {
            new() { Key = "customerPhone", Label = "SĐT khách", Prefix = "SĐT khách: ", Required = true },
            new() { Key = "viewTime", Label = "Giờ xem / ngày xem", Prefix = "Giờ xem: ", Suffix = "                ngày xem: ", Required = false },
            new() { Key = "_call_notice", Label = "Lưu ý gọi trước", Prefix = "( Qua gọi trước 30P - 1 tiếng )", Required = false },
            new() { Key = "address", Label = "Địa chỉ", Prefix = "Địa chỉ: ", Required = true },
            new() { Key = "price", Label = "Giá tư vấn", Prefix = "Giá tư vấn: ", Required = true },
            new() { Key = "roomCode", Label = "Mã tòa", Prefix = "Mã tòa: ", Required = false }
        }
    };

    public static readonly FormatSchema LUSACO = new()
    {
        Id = "lusaco",
        Name = "LUSACO",
        Icon = "🔹",
        Description = "Định dạng gửi tin nhắn cho hệ thống LUSACO",
        HeaderTemplate = "🔹LUSACO🔹\r\n",
        FooterTemplate = "\r\n🌸Cảm ơn Anh/Chị đã đón Khách 🌸",
        DefaultValues = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["salesName"] = "Thiên Ngọc"
        },
        Fields = new List<FormatField>
        {
            new() { Key = "roomCode", Label = "Mã nguồn", Prefix = "🫶🏻Mã nguồn: ", Required = false },
            new() { Key = "salesName", Label = "Tên CTV", Prefix = "👉Tên CTV: ", Required = false },
            new() { Key = "address", Label = "Địa chỉ", Prefix = "👉Địa chỉ: ", Required = true },
            new() { Key = "customerPhone", Label = "SĐT", Prefix = "👉SĐT: ", Required = true },
            new() { Key = "price", Label = "Giá tư vấn", Prefix = "👉Giá tư vấn: ", Required = true },
            new() { Key = "viewTime", Label = "Thời gian khách đi xem", Prefix = "👉 Thời gian khách đi xem: ", Required = false }
        }
    };

    public static readonly FormatSchema HDHomes = new()
    {
        Id = "hd_homes",
        Name = "HD Homes",
        Icon = "🔥",
        Description = "Định dạng gửi tin nhắn cho team HD Homes",
        HeaderTemplate = "🔥Form Bắn Khách HD Homes 🔥",
        FooterTemplate = "Cảm Ơn Bên Phía Đối Tác Đã Dẫn Khách Giúp Bên Em Ạ 🤝",
        DefaultValues = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["salesName"] = "Thiên Ngọc"
        },
        Fields = new List<FormatField>
        {
            new() { Key = "customerPhone", Label = "SDT khách", Prefix = "📞 SDT khách: ", Required = true },
            new() { Key = "salesName", Label = "Tên CTV", Prefix = "✨Tên CTV: ", Required = false },
            new() { Key = "address", Label = "Địa chỉ phòng", Prefix = "✨Địa chỉ phòng: ", Required = true },
            new() { Key = "roomCode", Label = "Mã phòng", Prefix = "✨Mã phòng: ", Required = false },
            new() { Key = "price", Label = "Giá phòng", Prefix = "✨Giá phòng: ", Required = true },
            new() { Key = "viewTime", Label = "Ngày, giờ xem", Prefix = "⏰ Ngày, giờ xem: ", Required = false },
            new() { Key = "customerName", Label = "Tên KH (FB/Zalo)", Prefix = "✨Tên KH (FB/Zalo): ", FallbackTo = "customerPhone", Required = false }
        }
    };

    public static readonly FormatSchema NTHome = new()
    {
        Id = "nt_home",
        Name = "NT HOME",
        Icon = "⭐",
        Description = "Định dạng gửi tin nhắn cho hệ thống NT HOME",
        HeaderTemplate = "🔥Form bắn khách bắt buộc🔥\r\n🔥 NT HOME ⭐️",
        FooterTemplate = "",
        DefaultValues = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["salesName"] = "Đán"
        },
        Fields = new List<FormatField>
        {
            new() { Key = "customerPhone", Label = "Sđt khách", Prefix = "👉Sđt khách: ", Required = true },
            new() { Key = "customerName", Label = "Tên Khách/(tên zalo)", Prefix = "👉Tên Khách/(tên zalo): ", FallbackTo = "customerPhone", Required = false },
            new() { Key = "roomCode", Label = "Mã", Prefix = "👉Mã: ", Required = false },
            new() { Key = "address", Label = "Địa chỉ", Prefix = "👉Địa chỉ: ", Required = true },
            new() { Key = "viewTime", Label = "Ngày/giờ xem phòng", Prefix = "👉Ngày/giờ xem phòng: ", Required = false },
            new() { Key = "price", Label = "Giá tư vấn", Prefix = "👉Giá tư vấn: ", Required = true },
            new() { Key = "salesName", Label = "Tên CTV", Prefix = "👉Tên CTV: ", Required = false }
        }
    };

    public static readonly FormatSchema NinetyFiveHome = new()
    {
        Id = "95_home",
        Name = "95 HOME",
        Icon = "📙",
        Description = "Định dạng bắn số cho team 95 HOME",
        HeaderTemplate = "📙📙 95 HOME -  FORM BẮN SỐ 📋\r\n\r\n❤️ TEAM : TÂM\r\n",
        FooterTemplate = "\r\nNhờ Anh/Chị/ Chủ Nhà Dẫn Khách Giúp 95 Home . Xin cảm ơn ạ",
        DefaultValues = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["salesName"] = "Thiên Ngọc"
        },
        Fields = new List<FormatField>
        {
            new() { Key = "customerPhone", Label = "Số Khách", Prefix = "📲 Số Khách: ", Required = true },
            new() { Key = "roomCode", Label = "Mã Hàng ( Nếu có )", Prefix = "📔 Mã Hàng ( Nếu có ): ", Required = false },
            new() { Key = "customerName", Label = "Tên Facebook / Zalo khách", Prefix = "👤 Tên Facebook / Zalo khách: ", FallbackTo = "customerPhone", Required = false },
            new() { Key = "address", Label = "Địa Chỉ", Prefix = "🕹️ Địa Chỉ : ", Required = true },
            new() { Key = "viewTime", Label = "Ngày & Giờ Xem", Prefix = "🧭 Ngày & Giờ Xem : ", Required = false },
            new() { Key = "price", Label = "Giá Tư Vấn", Prefix = "💰 Giá Tư Vấn  : ", Required = true },
            new() { Key = "electricVehicle", Label = "xe điện", Prefix = "🚗 xe điện : ", Required = false },
            new() { Key = "pet", Label = "Pet", Prefix = "🐾 Pet: ", Required = false },
            new() { Key = "moveInDate", Label = "Thời gian dự kiến vào ở", Prefix = "📅 Thời gian dự kiến vào ở: ", Required = false }
        }
    };

    public static IReadOnlyList<FormatSchema> GetAllDefaultSchemas() => new List<FormatSchema>
    {
        ASkyGroup,
        TL21House,
        TNRHome,
        LUSACO,
        HDHomes,
        NTHome,
        NinetyFiveHome
    };
}
