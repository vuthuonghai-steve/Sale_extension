using AppForms.Backend.Services.Rules;
using AppForms.Backend.Services.Rules.Definitions;
using Xunit;

namespace AppForms.Tests.Backend;

public class SpecialRoomCodeRulesTests
{
    private readonly CPrefixTL21SpecialRule _cPrefixRule = new();
    private readonly StandardPrefixRules _standardPrefixRule = new();
    private readonly SpecialRoomCodeRuleEngine _engine = new();

    [Theory]
    [InlineData("C101", "tl21_house")]
    [InlineData("c205", "tl21_house")]
    [InlineData("C-01", "tl21_house")]
    [InlineData("c 12", "tl21_house")]
    [InlineData("C_302", "tl21_house")]
    [InlineData("C383", "tl21_house")]
    [InlineData("c402b", "tl21_house")]
    public void CPrefixRule_ValidPrefix_MatchesTL21House(string roomCode, string expectedSchema)
    {
        var matched = _cPrefixRule.TryMatch(roomCode, out var schemaId, out var reason);

        Assert.True(matched);
        Assert.Equal(expectedSchema, schemaId);
        Assert.NotNull(reason);
        Assert.Contains("tl21_house", reason);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void CPrefixRule_InvalidOrEmpty_ReturnsFalse(string? roomCode)
    {
        var matched = _cPrefixRule.TryMatch(roomCode!, out var schemaId, out var reason);

        Assert.False(matched);
        Assert.Null(schemaId);
        Assert.Null(reason);
    }

    [Theory]
    [InlineData("Mn35", "lusaco")]
    [InlineData("mn 12", "lusaco")]
    [InlineData("Ts007", "hd_homes")]
    [InlineData("ts 99", "hd_homes")]
    [InlineData("NT023", "nt_home")]
    [InlineData("nt 01", "nt_home")]
    [InlineData("95-01", "95_home")]
    [InlineData("tl101", "tl21_house")]
    public void StandardPrefixRule_ValidPrefix_MatchesCorrectSchema(string roomCode, string expectedSchema)
    {
        var matched = _standardPrefixRule.TryMatch(roomCode, out var schemaId, out var reason);

        Assert.True(matched);
        Assert.Equal(expectedSchema, schemaId);
        Assert.NotNull(reason);
    }

    [Fact]
    public void RuleEngine_CPrefixTakesPrecedence_ReturnsCPrefixRuleName()
    {
        var matched = _engine.TryMatch("C383", out var schemaId, out var reason, out var ruleName);

        Assert.True(matched);
        Assert.Equal("tl21_house", schemaId);
        Assert.Equal("CPrefix_TL21House_SpecialRule", ruleName);
        Assert.NotNull(reason);
    }

    [Fact]
    [System.Diagnostics.CodeAnalysis.SuppressMessage("Assertions", "xUnit2000:Constants should be passed first", Justification = "Test readability")]
    public void RuleEngine_UnknownCode_ReturnsFalse()
    {
        var matched = _engine.TryMatch("UNKNOWN_123", out var schemaId, out var reason, out var ruleName);

        Assert.False(matched);
        Assert.Null(schemaId);
        Assert.Null(reason);
        Assert.Null(ruleName);
    }
}
