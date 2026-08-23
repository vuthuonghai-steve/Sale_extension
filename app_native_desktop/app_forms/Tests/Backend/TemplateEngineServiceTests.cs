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
}
