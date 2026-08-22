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
}
