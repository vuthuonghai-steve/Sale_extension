using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Schemas;
using AppForms.Backend.Services;
using Xunit;

namespace AppForms.Tests.Backend;

public class TemplateEngineServiceTests
{
    private readonly TemplateEngineService _engine = new();

    [Theory]
    [InlineData("C101", "101")]
    [InlineData("c205", "205")]
    [InlineData("C-01", "01")]
    [InlineData("c 12", "12")]
    [InlineData("C_302", "302")]
    [InlineData("C383", "383")]
    [InlineData("c-402b", "402b")]
    [InlineData("TL-99", "TL-99")]
    public void Render_TL21House_CPrefixRoomCode_StripsCPrefixAndKeepsNumber(string inputRoomCode, string expectedFormattedCode)
    {
        // Arrange
        var lead = new LeadEntity
        {
            RoomCode = inputRoomCode,
            Address = "123 CMT8, Q10",
            Price = "5tr",
            CustomerPhone = "0912345678",
            SalesName = "Thiên Ngọc"
        };
        var schema = DefaultSchemas.TL21House;

        // Act
        var rendered = _engine.Render(lead, schema);

        // Assert
        Assert.Contains($"☘️MÃ PHÒNG : {expectedFormattedCode}", rendered);
    }

    [Fact]
    public void Render_SapphireHouseTT_StandardLead_ProducesExpectedOutput()
    {
        // Arrange
        var lead = new LeadEntity
        {
            CustomerName = "Nguyễn Văn A",
            CustomerPhone = "0987654321",
            RoomCode = "SP-102",
            Address = "456 Lê Văn Sỹ, P.12, Q.3",
            Price = "7.5 triệu",
            ViewTime = "15h chiều nay"
        };
        var schema = DefaultSchemas.SapphireHouseTT;

        // Act
        var rendered = _engine.Render(lead, schema);

        // Assert
        var expected = string.Join(Environment.NewLine, new[]
        {
            "🦁 🌹SAPPHIRE HOUSE TT 🌹 🦁",
            "🍀Khách : Nguyễn Văn A",
            "🍀MÃ : SP-102",
            "🍀Địa chỉ : 456 Lê Văn Sỹ, P.12, Q.3",
            "🍀Tài chính : 7.5 triệu",
            "🍀Thời gian : 15h chiều nay",
            "🍀Sdt : 0987654321"
        });

        Assert.Equal(expected, rendered);
    }

    [Fact]
    public void Render_SapphireHouseTT_MissingCustomerName_FallbacksToCustomerPhone()
    {
        // Arrange
        var lead = new LeadEntity
        {
            CustomerName = null,
            CustomerPhone = "0987654321",
            RoomCode = "SP-102",
            Address = "456 Lê Văn Sỹ, P.12, Q.3",
            Price = "7.5 triệu",
            ViewTime = "15h chiều nay"
        };
        var schema = DefaultSchemas.SapphireHouseTT;

        // Act
        var rendered = _engine.Render(lead, schema);

        // Assert
        Assert.Contains("🍀Khách : 0987654321", rendered);
    }

    [Fact]
    public void Render_Tro365_StandardLead_ProducesExpectedOutput()
    {
        // Arrange
        var lead = new LeadEntity
        {
            Address = "123 Đường Láng, Đống Đa",
            Price = "4.5 triệu",
            ViewTime = "18h30 tối",
            RoomCode = "365-P201",
            CustomerPhone = "0901234567"
        };
        var schema = DefaultSchemas.Tro365;

        // Act
        var rendered = _engine.Render(lead, schema, fixedCtvName: "Thiên Ngọc");

        // Assert
        var expected = string.Join(Environment.NewLine, new[]
        {
            "ㅤ                🥳🎊Trọ 365🎊🥳",
            "👑Địa Chỉ : 123 Đường Láng, Đống Đa",
            "👑Giá Tư Vấn : 4.5 triệu",
            "👑 Giờ Xem : 18h30 tối",
            "👑CTV : Thiên Ngọc",
            "👑Mã Phòng : 365-P201",
            "📞Sđt : 0901234567",
            "  Chúc Anh Chị sớm lấp hết phòng 🎯"
        });

        Assert.Equal(expected, rendered);
    }

    [Fact]
    public void Render_ANHomes_StandardLead_ProducesExpectedOutputWithNguyenDan()
    {
        // Arrange
        var lead = new LeadEntity
        {
            RoomCode = "AN-102",
            CustomerPhone = "0988776655",
            ViewTime = "14h ngày mai",
            Address = "789 Hoàng Hoa Thám, Ba Đình",
            Price = "6.2 triệu"
        };
        var schema = DefaultSchemas.ANHomes;

        // Act - Không truyền fixedCtvName
        var rendered = _engine.Render(lead, schema);

        // Assert
        var expected = string.Join(Environment.NewLine, new[]
        {
            "-ANHOMES-",
            "🏠Tên CTV: Nguyên Đán",
            " Mã phòng: AN-102",
            "📞SĐT khách : 0988776655",
            "⏰Giờ xem / ngày xem: 14h ngày mai",
            "🏖️Địa chỉ : 789 Hoàng Hoa Thám, Ba Đình",
            "💵Giá tư vấn : 6.2 triệu"
        });

        Assert.Equal(expected, rendered);
    }

    [Fact]
    public void Render_ANHomes_WithGlobalFixedCtv_PreservesNguyenDan()
    {
        // Arrange
        var lead = new LeadEntity
        {
            RoomCode = "AN-102",
            CustomerPhone = "0988776655",
            ViewTime = "14h ngày mai",
            Address = "789 Hoàng Hoa Thám, Ba Đình",
            Price = "6.2 triệu"
        };
        var schema = DefaultSchemas.ANHomes;

        // Act - Truyền fixedCtvName = "Thiên Ngọc" (giả lập cấu hình toàn cục từ Settings)
        var rendered = _engine.Render(lead, schema, fixedCtvName: "Thiên Ngọc");

        // Assert - Phải giữ "Nguyên Đán" thay vì bị thay bằng "Thiên Ngọc"
        Assert.Contains("🏠Tên CTV: Nguyên Đán", rendered);
        Assert.DoesNotContain("Thiên Ngọc", rendered);
    }

    [Fact]
    public void Render_Tro365_WithCustomFixedCtv_UsesCustomFixedCtv()
    {
        // Arrange
        var lead = new LeadEntity
        {
            Address = "123 Cầu Giấy",
            Price = "5tr",
            CustomerPhone = "0900000000"
        };
        var schema = DefaultSchemas.Tro365;

        // Act - Truyền fixedCtvName = "Thanh Tâm"
        var rendered = _engine.Render(lead, schema, fixedCtvName: "Thanh Tâm");

        // Assert
        Assert.Contains("👑CTV : Thanh Tâm", rendered);
    }
}
