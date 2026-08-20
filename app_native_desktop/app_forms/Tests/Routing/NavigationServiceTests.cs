using AppForms.Backend.Services.Routing;
using AppForms.Shared.Enums;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace AppForms.Tests.Routing;

public class NavigationServiceTests
{
    private readonly NavigationService _navigationService;

    public NavigationServiceTests()
    {
        _navigationService = new NavigationService(NullLogger<NavigationService>.Instance);
    }

    [Fact]
    public void RegisteredRoutes_ShouldContainAllDefaultRoutes_InCorrectDisplayOrder()
    {
        // Act
        var routes = _navigationService.RegisteredRoutes;

        // Assert
        Assert.Equal(4, routes.Count);
        Assert.Equal(AppRouteId.Dashboard, routes[0].RouteId);
        Assert.Equal(AppRouteId.LeadConverter, routes[1].RouteId);
        Assert.Equal(AppRouteId.MessageCleaner, routes[2].RouteId);
        Assert.Equal(AppRouteId.Settings, routes[3].RouteId);

        Assert.True(routes[0].ShowInHeaderNav);
        Assert.False(routes[0].ShowInDashboardLaunchpad);
        Assert.True(routes[1].ShowInDashboardLaunchpad);
    }

    [Fact]
    public void CanNavigate_ShouldReturnFalse_WhenScreenFactoryNotRegistered()
    {
        // Act & Assert
        Assert.False(_navigationService.CanNavigate(AppRouteId.Dashboard));
        Assert.False(_navigationService.NavigateTo(AppRouteId.Dashboard));
    }

    [Fact]
    public void NavigateTo_ShouldSucceed_AndRaiseNavigatedEvent_WhenFactoryRegistered()
    {
        // Arrange
        var dummyDashboard = new object();
        _navigationService.RegisterScreenFactory(AppRouteId.Dashboard, () => dummyDashboard);

        AppRouteId? eventFiredRoute = null;
        _navigationService.Navigated += (_, routeId) => eventFiredRoute = routeId;

        // Act
        var result = _navigationService.NavigateTo(AppRouteId.Dashboard);

        // Assert
        Assert.True(result);
        Assert.Equal(AppRouteId.Dashboard, _navigationService.CurrentRoute);
        Assert.Equal(AppRouteId.Dashboard, eventFiredRoute);
    }

    [Fact]
    public void ResolveCurrentScreen_ShouldReturnCachedInstance_PreservingState()
    {
        // Arrange
        int factoryCallCount = 0;
        _navigationService.RegisterScreenFactory(AppRouteId.LeadConverter, () =>
        {
            factoryCallCount++;
            return new object();
        });

        // Act
        _navigationService.NavigateTo(AppRouteId.LeadConverter);
        var instance1 = _navigationService.ResolveCurrentScreen();
        var instance2 = _navigationService.ResolveCurrentScreen();

        // Assert
        Assert.NotNull(instance1);
        Assert.Same(instance1, instance2);
        Assert.Equal(1, factoryCallCount);
    }

    [Fact]
    public void DeadEndRouteGuard_ShouldFallbackToDashboard_WhenFactoryThrowsException()
    {
        // Arrange
        var dummyDashboard = new object();
        _navigationService.RegisterScreenFactory(AppRouteId.Dashboard, () => dummyDashboard);
        _navigationService.RegisterScreenFactory(AppRouteId.LeadConverter, () => throw new InvalidOperationException("Crashing screen"));

        // Act
        var result = _navigationService.NavigateTo(AppRouteId.LeadConverter);

        // Assert
        Assert.True(result);
        Assert.Equal(AppRouteId.Dashboard, _navigationService.CurrentRoute);
    }

    [Fact]
    public void NavigateHome_ShouldNavigateToDashboard_WhenFactoryRegistered()
    {
        // Arrange
        var dummyDashboard = new object();
        var dummyLead = new object();
        _navigationService.RegisterScreenFactory(AppRouteId.Dashboard, () => dummyDashboard);
        _navigationService.RegisterScreenFactory(AppRouteId.LeadConverter, () => dummyLead);

        _navigationService.NavigateTo(AppRouteId.LeadConverter);
        Assert.Equal(AppRouteId.LeadConverter, _navigationService.CurrentRoute);

        // Act
        var result = _navigationService.NavigateHome();

        // Assert
        Assert.True(result);
        Assert.Equal(AppRouteId.Dashboard, _navigationService.CurrentRoute);
    }
}
