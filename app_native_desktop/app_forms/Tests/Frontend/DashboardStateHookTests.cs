using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Frontend.Screens.Dashboard.Hooks;
using AppForms.Shared.Constants;
using AppForms.Shared.Enums;
using AppForms.Shared.Models.Routing;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace AppForms.Tests.Frontend;

public class DashboardStateHookTests
{
    private readonly Mock<INavigationService> _mockNavService;
    private readonly Mock<IBackgroundFeatureRegistry> _mockFeatureRegistry;
    private readonly Mock<ISettingsService> _mockSettingsService;
    private readonly Mock<IRoomCodeReadOnlyRepository> _mockRoomCodeRepo;

    public DashboardStateHookTests()
    {
        _mockNavService = new Mock<INavigationService>();
        _mockFeatureRegistry = new Mock<IBackgroundFeatureRegistry>();
        _mockSettingsService = new Mock<ISettingsService>();
        _mockRoomCodeRepo = new Mock<IRoomCodeReadOnlyRepository>();

        _mockNavService.Setup(n => n.RegisteredRoutes).Returns(new List<AppRouteDescriptor>
        {
            new(AppRouteId.Dashboard, "Tổng Quan", "🏠", "Home", 1, true, false, false),
            new(AppRouteId.LeadConverter, "Chuyển Lead", "📋", "Convert", 2, true, true, true, "clipboard_monitor")
        });

        _mockFeatureRegistry.Setup(f => f.GetAllFeatureStatuses()).Returns(new List<BackgroundFeatureStatus>
        {
            new("clipboard_monitor", "Clipboard", "Desc", "📋", true)
        });

        _mockSettingsService.Setup(s => s.Current).Returns(new AppSettings
        {
            FixedCtvName = "Nguyễn Văn A"
        });

        _mockRoomCodeRepo.Setup(r => r.GetAllGroupCodes()).Returns(new Dictionary<string, List<string>>
        {
            { "tl21_house", new List<string> { "TL1", "TL2" } }
        });
    }

    [Fact]
    public void DashboardStateHook_ShouldLoadInitialStateCorrectly()
    {
        // Act
        var hook = new DashboardStateHook(
            NullLogger<DashboardStateHook>.Instance,
            _mockNavService.Object,
            _mockFeatureRegistry.Object,
            _mockSettingsService.Object,
            _mockRoomCodeRepo.Object
        );

        // Assert
        Assert.NotNull(hook.CurrentModel);
        Assert.Equal("Nguyễn Văn A", hook.CurrentModel.CtvName);
        Assert.Equal(AppConstants.AppVersion, hook.CurrentModel.AppVersion);
        Assert.Equal(2, hook.CurrentModel.TotalRoomsCount);
        Assert.Single(hook.CurrentModel.FeatureCards);
        
        var leadCard = hook.CurrentModel.FeatureCards[0];
        Assert.Equal(AppRouteId.LeadConverter, leadCard.RouteId);
        Assert.True(leadCard.HasBackgroundService);
        Assert.True(leadCard.IsRunning);
        Assert.Equal(1, hook.CurrentModel.RunningServicesCount);
        Assert.Equal(1, hook.CurrentModel.TotalServicesCount);
        Assert.Contains("1/1 dịch vụ ngầm đang hoạt động", hook.CurrentModel.StatusSummary);
    }

    [Fact]
    public void NavigateTo_ShouldCallNavigationService()
    {
        // Arrange
        _mockNavService.Setup(n => n.NavigateTo(AppRouteId.LeadConverter, null)).Returns(true);

        var hook = new DashboardStateHook(
            NullLogger<DashboardStateHook>.Instance,
            _mockNavService.Object,
            _mockFeatureRegistry.Object,
            _mockSettingsService.Object,
            _mockRoomCodeRepo.Object
        );

        // Act
        var result = hook.NavigateTo(AppRouteId.LeadConverter);

        // Assert
        Assert.True(result);
        _mockNavService.Verify(n => n.NavigateTo(AppRouteId.LeadConverter, null), Times.Once);
    }
}
