using System;
using AppForms.Backend.Adapters.Win32;
using AppForms.Backend.Services.Hotkey;
using AppForms.Shared.Enums;
using AppForms.Shared.Models.Hotkey;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace AppForms.Tests.Backend;

public class HotkeyManagerServiceTests
{
    [Fact]
    public void RegisterHotkey_ValidDefinition_RegistersSuccessfully()
    {
        using var listener = new Win32HotkeyListener(NullLogger<Win32HotkeyListener>.Instance);
        using var service = new HotkeyManagerService(listener, NullLogger<HotkeyManagerService>.Instance);

        var hotkey = new HotkeyDefinition(
            id: "test_alt_1",
            name: "Test Alt 1",
            description: "Test description",
            modifiers: KeyModifiers.Alt,
            key: VirtualKey.D1
        );

        var registered = service.RegisterHotkey(hotkey);

        Assert.True(registered);
        var retrieved = service.GetHotkey("test_alt_1");
        Assert.NotNull(retrieved);
        Assert.Equal("Test Alt 1", retrieved.Name);
        Assert.True(retrieved.IsEnabled);
    }

    [Fact]
    public void Enable_Disable_Toggle_Hotkey_UpdatesStateCorrectly()
    {
        using var listener = new Win32HotkeyListener(NullLogger<Win32HotkeyListener>.Instance);
        using var service = new HotkeyManagerService(listener, NullLogger<HotkeyManagerService>.Instance);

        var hotkey = new HotkeyDefinition(
            id: "test_toggle",
            name: "Test Toggle",
            description: "Test description",
            modifiers: KeyModifiers.Alt,
            key: VirtualKey.D2,
            isEnabled: true
        );

        service.RegisterHotkey(hotkey);

        // Disable
        service.DisableHotkey("test_toggle");
        Assert.False(service.GetHotkey("test_toggle")?.IsEnabled);

        // Enable
        service.EnableHotkey("test_toggle");
        Assert.True(service.GetHotkey("test_toggle")?.IsEnabled);

        // Toggle
        service.ToggleHotkey("test_toggle");
        Assert.False(service.GetHotkey("test_toggle")?.IsEnabled);

        service.ToggleHotkey("test_toggle");
        Assert.True(service.GetHotkey("test_toggle")?.IsEnabled);
    }

    [Fact]
    public void SetGlobalListening_TogglesMasterListeningState()
    {
        using var listener = new Win32HotkeyListener(NullLogger<Win32HotkeyListener>.Instance);
        using var service = new HotkeyManagerService(listener, NullLogger<HotkeyManagerService>.Instance);

        Assert.True(service.IsGlobalListening);

        service.SetGlobalListening(false);
        Assert.False(service.IsGlobalListening);

        service.SetGlobalListening(true);
        Assert.True(service.IsGlobalListening);
    }

    [Fact]
    public void UnregisterHotkey_RemovesHotkeyFromRegistry()
    {
        using var listener = new Win32HotkeyListener(NullLogger<Win32HotkeyListener>.Instance);
        using var service = new HotkeyManagerService(listener, NullLogger<HotkeyManagerService>.Instance);

        var hotkey = new HotkeyDefinition(
            id: "to_remove",
            name: "To Remove",
            description: "Remove me",
            modifiers: KeyModifiers.Alt,
            key: VirtualKey.D3
        );

        service.RegisterHotkey(hotkey);
        Assert.NotNull(service.GetHotkey("to_remove"));

        var removed = service.UnregisterHotkey("to_remove");
        Assert.True(removed);
        Assert.Null(service.GetHotkey("to_remove"));
    }
}
