using System;
using System.Collections.Generic;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Frontend.Screens.HotkeyManager.Hooks;
using AppForms.Shared.Enums;
using AppForms.Shared.Models.Hotkey;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace AppForms.Tests.Frontend;

public class HotkeyManagerStateHookTests
{
    private readonly Mock<IHotkeyManager> _mockHotkeyManager;
    private readonly Mock<ITextSnippetService> _mockSnippetService;

    public HotkeyManagerStateHookTests()
    {
        _mockHotkeyManager = new Mock<IHotkeyManager>();
        _mockSnippetService = new Mock<ITextSnippetService>();
    }

    [Fact]
    public void LoadData_ShouldPopulateCurrentModel()
    {
        // Arrange
        _mockHotkeyManager.Setup(h => h.IsGlobalListening).Returns(true);
        _mockHotkeyManager.Setup(h => h.GetAllHotkeys()).Returns(new List<HotkeyDefinition>
        {
            new("test_alt_1", "Phân cách", "Mô tả", KeyModifiers.Alt, VirtualKey.D1, null, "Snippets", true)
        });

        // Act
        var hook = new HotkeyManagerStateHook(
            _mockHotkeyManager.Object,
            _mockSnippetService.Object,
            NullLogger<HotkeyManagerStateHook>.Instance
        );

        // Assert
        Assert.NotNull(hook.CurrentModel);
        Assert.True(hook.CurrentModel.IsGlobalListening);
        Assert.Equal(1, hook.CurrentModel.ActiveHotkeysCount);
        Assert.Equal(1, hook.CurrentModel.TotalHotkeysCount);
        Assert.Single(hook.CurrentModel.Items);
        Assert.Equal("Alt + 1", hook.CurrentModel.Items[0].KeyCombinationText);
    }

    [Fact]
    public void ToggleGlobalListening_ShouldCallSetGlobalListening()
    {
        // Arrange
        _mockHotkeyManager.Setup(h => h.IsGlobalListening).Returns(true);
        _mockHotkeyManager.Setup(h => h.GetAllHotkeys()).Returns(new List<HotkeyDefinition>());

        var hook = new HotkeyManagerStateHook(
            _mockHotkeyManager.Object,
            _mockSnippetService.Object,
            NullLogger<HotkeyManagerStateHook>.Instance
        );

        // Act
        hook.ToggleGlobalListening();

        // Assert
        _mockHotkeyManager.Verify(h => h.SetGlobalListening(false), Times.Once);
    }

    [Fact]
    public void ToggleHotkey_ShouldCallHotkeyManagerToggle()
    {
        // Arrange
        _mockHotkeyManager.Setup(h => h.IsGlobalListening).Returns(true);
        _mockHotkeyManager.Setup(h => h.GetAllHotkeys()).Returns(new List<HotkeyDefinition>());

        var hook = new HotkeyManagerStateHook(
            _mockHotkeyManager.Object,
            _mockSnippetService.Object,
            NullLogger<HotkeyManagerStateHook>.Instance
        );

        // Act
        hook.ToggleHotkey("test_alt_1");

        // Assert
        _mockHotkeyManager.Verify(h => h.ToggleHotkey("test_alt_1"), Times.Once);
    }

    [Fact]
    public void TestTriggerHotkey_ShouldInvokeAction()
    {
        // Arrange
        var actionExecuted = false;
        var hotkey = new HotkeyDefinition("test_action", "Action", "Desc", KeyModifiers.Alt, VirtualKey.D2, () => actionExecuted = true);

        _mockHotkeyManager.Setup(h => h.GetHotkey("test_action")).Returns(hotkey);
        _mockHotkeyManager.Setup(h => h.GetAllHotkeys()).Returns(new List<HotkeyDefinition> { hotkey });

        var hook = new HotkeyManagerStateHook(
            _mockHotkeyManager.Object,
            _mockSnippetService.Object,
            NullLogger<HotkeyManagerStateHook>.Instance
        );

        // Act
        hook.TestTriggerHotkey("test_action");

        // Assert
        Assert.True(actionExecuted);
    }
}
