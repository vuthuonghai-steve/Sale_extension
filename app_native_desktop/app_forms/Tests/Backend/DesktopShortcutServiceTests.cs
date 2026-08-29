using AppForms.Backend.Adapters.Win32;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Shared.Models.Shortcut;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace AppForms.Tests.Backend;

public class DesktopShortcutServiceTests
{
    private readonly DesktopShortcutService _shortcutService;

    public DesktopShortcutServiceTests()
    {
        _shortcutService = new DesktopShortcutService(NullLogger<DesktopShortcutService>.Instance);
    }

    [Fact]
    public void EnsureShortcutSelfHeal_ExecutesWithoutException()
    {
        // Act
        var result = _shortcutService.EnsureShortcutSelfHeal();

        // Assert
        Assert.NotNull(result);
        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void CreateOrUpdateShortcut_CreatesShortcutSuccessfully()
    {
        // Act
        var result = _shortcutService.CreateOrUpdateShortcut(desktop: true, startMenu: false);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.IsSuccess);
        Assert.True(_shortcutService.IsDesktopShortcutExists());
    }

    [Fact]
    public void RemoveShortcut_RemovesDesktopShortcutSuccessfully()
    {
        // Arrange: Make sure it exists first
        _shortcutService.CreateOrUpdateShortcut(desktop: true, startMenu: false);
        Assert.True(_shortcutService.IsDesktopShortcutExists());

        // Act
        var result = _shortcutService.RemoveShortcut(desktop: true, startMenu: false);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.IsSuccess);
        Assert.False(_shortcutService.IsDesktopShortcutExists());

        // Cleanup: Re-create for normal development
        _shortcutService.CreateOrUpdateShortcut(desktop: true, startMenu: true);
    }
}
