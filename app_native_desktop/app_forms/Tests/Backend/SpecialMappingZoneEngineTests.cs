using AppForms.Backend.Services.Rules;
using AppForms.Backend.Services.Rules.Definitions;
using Xunit;

namespace AppForms.Tests.Backend;

public class SpecialMappingZoneEngineTests
{
    private readonly TL21PrefixStrippingZoneRule _tl21Rule = new();
    private readonly SpecialMappingZoneEngine _engine = new();

    [Theory]
    [InlineData("C454", "454")]
    [InlineData("c454", "454")]
    [InlineData("C-454", "454")]
    [InlineData("c-454", "454")]
    [InlineData("C 454", "454")]
    [InlineData("C973", "973")]
    [InlineData("c085", "085")]
    [InlineData("C007A", "007A")]
    [InlineData("C-007A", "007A")]
    public void TL21PrefixStrippingZoneRule_ValidCPrefix_ReturnsExpectedCandidate(string rawInput, string expectedCandidate)
    {
        var matched = _tl21Rule.TryResolveCandidates(rawInput, out var candidates);

        Assert.True(matched);
        Assert.Contains(expectedCandidate, candidates);
    }

    [Theory]
    [InlineData("D170")]
    [InlineData("MN220")]
    [InlineData("AHS284")]
    [InlineData("DN01")]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void TL21PrefixStrippingZoneRule_NonCPrefix_ReturnsFalse(string? rawInput)
    {
        var matched = _tl21Rule.TryResolveCandidates(rawInput!, out var candidates);

        Assert.False(matched);
        Assert.Empty(candidates);
    }

    [Theory]
    [InlineData("C454", "454")]
    [InlineData("c454", "454")]
    [InlineData("C-454", "454")]
    [InlineData("C 454", "454")]
    [InlineData("C973", "973")]
    public void SpecialMappingZoneEngine_ResolveCandidateCodes_ResolvesCorrectly(string rawInput, string expectedCandidate)
    {
        var candidates = _engine.ResolveCandidateCodes(rawInput);

        Assert.NotEmpty(candidates);
        Assert.Contains(expectedCandidate, candidates);
    }

    [Fact]
    public void SpecialMappingZoneEngine_NonMatchingCode_ReturnsEmptyList()
    {
        var candidates = _engine.ResolveCandidateCodes("AHS284");

        Assert.Empty(candidates);
    }
}
