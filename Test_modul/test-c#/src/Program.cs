using ClipboardFilterApp.Contracts;
using ClipboardFilterApp.Engine;
using ClipboardFilterApp.Modules.CompositeModules;
using ClipboardFilterApp.Modules.SubModules;
using ClipboardFilterApp.PlatformAdapters;
using ClipboardFilterApp.PlatformAdapters.Logging;
using ClipboardFilterApp.Presentation;

namespace ClipboardFilterApp;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
#if DEBUG
        // Mở cửa sổ Console đen riêng khi đang trong chế độ Debug để theo dõi Log Realtime
        Win32ClipboardAdapter.AllocConsole();
        Console.Title = "OS Clipboard Filter - Realtime Debug Console";
        WindowsLoggerAdapter.LogInfo(">>> [DEBUG MODE] Đã gắn Debug Console Terminal vào ứng dụng OS thành công!");
#endif

        ApplicationConfiguration.Initialize();

        // 1. Config Options Schema
        FilterOptions options = new FilterOptions();

        // 2. Register Sub-modules Filters (Pure Business Logic)
        List<IClipboardFilter> filters = new List<IClipboardFilter>
        {
            new UnicodeSanitizerFilter(),
            new ReplyQuoteFilter(),
            new ZaloStickerFilter(),
            new BrandRegexFilter(),
            new CommissionRegexFilter(),
            new UrlSanitizerFilter()
        };

        // 3. Composite Module Orchestrator
        ClipboardPipelineManager pipelineManager = new ClipboardPipelineManager(options, filters);

        // 4. Native Engine Listener (Truyền options vào Orchestrator để quản lý trạng thái Bật/Tắt)
        using NativeClipboardListener listener = new NativeClipboardListener();
        using var orchestrator = new PipelineOrchestrator(options, pipelineManager, listener);

        // 5. Presentation Layer (System Tray)
        using SystemTrayApplicationContext context = new SystemTrayApplicationContext(options);

        // Run Windows Application Event Loop
        Application.Run(context);

        // Dọn dẹp và flush log trước khi thoát
        WindowsLoggerAdapter.Shutdown();
    }
}
