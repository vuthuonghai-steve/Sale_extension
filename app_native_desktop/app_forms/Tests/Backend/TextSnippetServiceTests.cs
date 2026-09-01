using AppForms.Backend.Adapters.Win32;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Services.Hotkey;
using AppForms.Shared.Constants;
using AppForms.Shared.Enums;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace AppForms.Tests.Backend;

public class TextSnippetServiceTests
{
    private class MockInputSimulator : IInputSimulator
    {
        public string? LastSentText { get; private set; }
        public int SentCount { get; private set; }

        public void SendText(string text)
        {
            LastSentText = text;
            SentCount++;
        }

        public void SendKey(VirtualKey key, KeyModifiers modifiers = KeyModifiers.None)
        {
        }
    }

    [Fact]
    public void InitializeDefaultSnippets_RegistersAlt1DividerSnippet()
    {
        using var listener = new Win32HotkeyListener(NullLogger<Win32HotkeyListener>.Instance);
        using var hotkeyManager = new HotkeyManagerService(listener, NullLogger<HotkeyManagerService>.Instance);
        var inputSimulator = new MockInputSimulator();

        var snippetService = new TextSnippetService(hotkeyManager, inputSimulator, NullLogger<TextSnippetService>.Instance);
        snippetService.InitializeDefaultSnippets();

        var dividerHotkey = hotkeyManager.GetHotkey(AppConstants.HotkeySnippets.DefaultDividerHotkeyId);
        Assert.NotNull(dividerHotkey);
        Assert.Equal(KeyModifiers.Alt, dividerHotkey.Modifiers);
        Assert.Equal(VirtualKey.D1, dividerHotkey.Key);
        Assert.True(dividerHotkey.IsEnabled);
    }

    [Fact]
    public void InsertDividerLine_SendsExpectedDividerText()
    {
        using var listener = new Win32HotkeyListener(NullLogger<Win32HotkeyListener>.Instance);
        using var hotkeyManager = new HotkeyManagerService(listener, NullLogger<HotkeyManagerService>.Instance);
        var inputSimulator = new MockInputSimulator();

        var snippetService = new TextSnippetService(hotkeyManager, inputSimulator, NullLogger<TextSnippetService>.Instance);
        snippetService.InsertDividerLine();

        Assert.Equal(AppConstants.HotkeySnippets.DefaultDividerLine, inputSimulator.LastSentText);
        Assert.Equal(1, inputSimulator.SentCount);
    }
}
