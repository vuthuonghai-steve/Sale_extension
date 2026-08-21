using AppForms.Backend.Adapters.Win32;
using AppForms.Backend.Contracts.Entities;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Services.MessageFilter;
using AppForms.Backend.Services.MessageFilter.SubFilters;
using AppForms.Shared.Common;
using AppForms.Shared.Models.MessageFilter;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace AppForms.Tests.MessageFilter;

public class PipelineOrchestratorSettingsSyncTests : IDisposable
{
    private readonly Mock<ISettingsService> _settingsServiceMock;
    private readonly Win32ClipboardListener _win32Listener;
    private readonly ClipboardPipelineManager _pipelineManager;
    private readonly AppSettings _currentSettings;

    public PipelineOrchestratorSettingsSyncTests()
    {
        _currentSettings = new AppSettings
        {
            MessageFilterOptions = new FilterPipelineOptions { EnableService = true }
        };

        _settingsServiceMock = new Mock<ISettingsService>();
        _settingsServiceMock.Setup(s => s.Current).Returns(_currentSettings);
        _settingsServiceMock.Setup(s => s.Update(It.IsAny<Action<AppSettings>>()))
            .Callback<Action<AppSettings>>(action =>
            {
                action(_currentSettings);
                _settingsServiceMock.Raise(s => s.SettingsSaved += null, EventArgs.Empty);
            })
            .Returns(Result.Success());

        _win32Listener = new Win32ClipboardListener(NullLogger<Win32ClipboardListener>.Instance);

        var filters = new List<IClipboardFilter>
        {
            new UnicodeSanitizerFilter(),
            new ReplyQuoteFilter(),
            new ZaloStickerFilter(),
            new BrandRegexFilter(),
            new CommissionRegexFilter(),
            new UrlSanitizerFilter()
        };

        _pipelineManager = new ClipboardPipelineManager(_currentSettings.MessageFilterOptions, filters);
    }

    [Fact]
    public void Constructor_WhenEnableServiceIsTrue_AutoStartsAndRegistersConsumer()
    {
        using var orchestrator = new PipelineOrchestratorService(
            NullLogger<PipelineOrchestratorService>.Instance,
            _settingsServiceMock.Object,
            _pipelineManager,
            _win32Listener
        );

        Assert.True(orchestrator.IsRunning);
        Assert.True(orchestrator.CurrentOptions.EnableService);
        Assert.Contains("MessageFilter", _win32Listener.ActiveConsumers);
    }

    [Fact]
    public void SettingsSaved_WhenEnableServiceChangesToFalse_AutomaticallyStops()
    {
        using var orchestrator = new PipelineOrchestratorService(
            NullLogger<PipelineOrchestratorService>.Instance,
            _settingsServiceMock.Object,
            _pipelineManager,
            _win32Listener
        );

        Assert.True(orchestrator.IsRunning);

        // Giả lập lưu cài đặt với EnableService = false từ SettingsScreen
        _settingsServiceMock.Object.Update(s => s.MessageFilterOptions.EnableService = false);

        Assert.False(orchestrator.IsRunning);
        Assert.False(orchestrator.CurrentOptions.EnableService);
        Assert.DoesNotContain("MessageFilter", _win32Listener.ActiveConsumers);
    }

    [Fact]
    public void SettingsSaved_WhenFilterRulesChanged_UpdatesPipelineOptions()
    {
        using var orchestrator = new PipelineOrchestratorService(
            NullLogger<PipelineOrchestratorService>.Instance,
            _settingsServiceMock.Object,
            _pipelineManager,
            _win32Listener
        );

        _settingsServiceMock.Object.Update(s =>
        {
            s.MessageFilterOptions.EnableCommissionFilter = false;
            s.MessageFilterOptions.EnableBrandFilter = false;
        });

        Assert.False(orchestrator.CurrentOptions.EnableCommissionFilter);
        Assert.False(orchestrator.CurrentOptions.EnableBrandFilter);
    }

    [Fact]
    public void StartAndStop_ExplicitCalls_SyncWithSettingsServiceAndListener()
    {
        _currentSettings.MessageFilterOptions.EnableService = false;

        using var orchestrator = new PipelineOrchestratorService(
            NullLogger<PipelineOrchestratorService>.Instance,
            _settingsServiceMock.Object,
            _pipelineManager,
            _win32Listener
        );

        Assert.False(orchestrator.IsRunning);

        // Bật từ Dashboard
        orchestrator.Start();

        Assert.True(orchestrator.IsRunning);
        Assert.True(orchestrator.CurrentOptions.EnableService);
        Assert.True(_currentSettings.MessageFilterOptions.EnableService);
        Assert.Contains("MessageFilter", _win32Listener.ActiveConsumers);

        // Tắt từ Dashboard
        orchestrator.Stop();

        Assert.False(orchestrator.IsRunning);
        Assert.False(orchestrator.CurrentOptions.EnableService);
        Assert.False(_currentSettings.MessageFilterOptions.EnableService);
        Assert.DoesNotContain("MessageFilter", _win32Listener.ActiveConsumers);
    }

    public void Dispose()
    {
        _win32Listener.Dispose();
        GC.SuppressFinalize(this);
    }
}
