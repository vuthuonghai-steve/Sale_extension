using AppForms.Backend.Adapters.Persistence;
using AppForms.Backend.Adapters.Persistence.Common;
using AppForms.Backend.Adapters.Win32;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Contracts.Rules;
using AppForms.Backend.Services;
using AppForms.Backend.Services.MessageFilter;
using AppForms.Backend.Services.MessageFilter.SubFilters;
using AppForms.Backend.Services.Routing;
using AppForms.Backend.Services.Rules;
using AppForms.Backend.Services.Rules.Definitions;
using AppForms.Shared.Models.Shortcut;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Serilog;

namespace AppForms.Backend.Infrastructure;

/// <summary>
/// Đăng ký toàn bộ Backend Services, Adapters, Repositories và Rule Engines vào DI.
/// Tuyệt đối không phụ thuộc vào WinForms UI Controls.
/// </summary>
public static class BackendServiceRegistration
{
    public static IServiceCollection AddBackendServices(this IServiceCollection services)
    {
        // Logging
        services.AddLogging(builder =>
        {
            builder.ClearProviders();
            builder.AddSerilog(dispose: true);
        });

        // Win32 & OS Adapters
        services.AddSingleton<IClipboardAdapter, WindowsClipboardAdapter>();
        services.AddSingleton<ISystemLauncherAdapter, WindowsSystemLauncherAdapter>();
        services.AddSingleton<Win32ClipboardListener>();

        // System Shortcut Service
        services.AddSingleton<IDesktopShortcutService, DesktopShortcutService>();

        // Core Domain Services
        services.AddSingleton<ITextSanitizer, TextSanitizerService>();
        services.AddSingleton<IMessageParser, MessageParserService>();
        services.AddSingleton<ITemplateEngine, TemplateEngineService>();
        services.AddSingleton<ISchemaManager, SchemaManagerService>();
        services.AddSingleton<ISettingsService, SettingsService>();
        services.AddSingleton<JsonRoomCodeRepository>();
        services.AddSingleton<IRoomCodeRepository>(sp => sp.GetRequiredService<JsonRoomCodeRepository>());
        services.AddSingleton<IRoomCodeReadOnlyRepository>(sp => sp.GetRequiredService<JsonRoomCodeRepository>());

        // Special Multi-System Room Code Mapping & Detection Services
        services.AddSingleton<ISpecialMappingZoneRule, TL21PrefixStrippingZoneRule>();
        services.AddSingleton<SpecialMappingZoneEngine>();
        services.AddSingleton<ISpecialMappingTextParser, SpecialMappingTextParser>();
        services.AddSingleton<JsonSpecialRoomMappingRepository>();
        services.AddSingleton<ISpecialRoomMappingRepository>(sp => sp.GetRequiredService<JsonSpecialRoomMappingRepository>());
        services.AddSingleton<ISpecialRoomMappingDetector, SpecialRoomMappingDetector>();

        // Room Code Rules & Schema Detection
        services.AddSingleton<ISpecialRoomCodeRule, CPrefixTL21SpecialRule>();
        services.AddSingleton<ISpecialRoomCodeRule, StandardPrefixRules>();
        services.AddSingleton<SpecialRoomCodeRuleEngine>();
        services.AddSingleton<ISchemaDetector, SchemaDetectorService>();
        services.AddSingleton<IFormConverterService, FormConverterService>();

        // Message Filter Pipeline Sub-modules
        services.AddSingleton<IClipboardFilter, UnicodeSanitizerFilter>();
        services.AddSingleton<IClipboardFilter, ReplyQuoteFilter>();
        services.AddSingleton<IClipboardFilter, ZaloStickerFilter>();
        services.AddSingleton<IClipboardFilter, BrandRegexFilter>();
        services.AddSingleton<IClipboardFilter, CommissionRegexFilter>();
        services.AddSingleton<IClipboardFilter, UrlSanitizerFilter>();
        services.AddSingleton<IClipboardFilter, PriceNormalizerFilter>();

        // Message Filter Pipeline Manager & Orchestrator
        services.AddSingleton<ClipboardPipelineManager>(sp =>
        {
            var settingsService = sp.GetRequiredService<ISettingsService>();
            var filters = sp.GetServices<IClipboardFilter>();
            var options = settingsService.Current.MessageFilterOptions ?? new AppForms.Shared.Models.MessageFilter.FilterPipelineOptions();
            return new ClipboardPipelineManager(options, filters);
        });
        services.AddSingleton<IFilterPipelineOrchestrator, PipelineOrchestratorService>();

        // Routing & Background Services
        services.AddSingleton<INavigationService, NavigationService>();
        services.AddSingleton<IBackgroundFeatureRegistry, BackgroundFeatureRegistry>();

        return services;
    }
}
