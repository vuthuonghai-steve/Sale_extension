using AppForms.Backend.Contracts.Interfaces;
using AppForms.Frontend.Screens.Dashboard;
using AppForms.Frontend.Screens.LeadConverter;
using AppForms.Frontend.Screens.MessageFilter;
using AppForms.Frontend.Screens.Settings;
using AppForms.Frontend.Shell;
using AppForms.Frontend.Shell.Hooks;
using AppForms.Frontend.Tray;
using AppForms.Shared.Enums;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AppForms.Frontend.Infrastructure;

/// <summary>
/// Đăng ký toàn bộ Frontend Screens, StateHooks, Tray Icon Manager và MainForm Router vào DI.
/// </summary>
public static class FrontendServiceRegistration
{
    public static IServiceCollection AddFrontendServices(this IServiceCollection services)
    {
        // Frontend Screens (Singletons để duy trì state trong RAM)
        services.AddSingleton<DashboardScreen>();
        services.AddSingleton<LeadConverterScreen>();
        services.AddSingleton<MessageCleanerScreen>();
        services.AddSingleton<SettingsScreen>();

        // Frontend Presentation & Shell UI
        services.AddSingleton<TrayIconManager>();
        services.AddSingleton<ShellStateHook>();
        
        services.AddSingleton<MainForm>(sp =>
        {
            var navService = sp.GetRequiredService<INavigationService>();

            // Đăng ký Screen Factories cho Navigation Router
            navService.RegisterScreenFactory(AppRouteId.Dashboard, () => sp.GetRequiredService<DashboardScreen>());
            navService.RegisterScreenFactory(AppRouteId.LeadConverter, () => sp.GetRequiredService<LeadConverterScreen>());
            navService.RegisterScreenFactory(AppRouteId.MessageCleaner, () => sp.GetRequiredService<MessageCleanerScreen>());
            navService.RegisterScreenFactory(AppRouteId.Settings, () => sp.GetRequiredService<SettingsScreen>());

            return new MainForm(
                sp.GetRequiredService<ILogger<MainForm>>(),
                sp.GetRequiredService<ShellStateHook>(),
                sp.GetRequiredService<TrayIconManager>()
            );
        });

        return services;
    }
}
