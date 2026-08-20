using AppForms.Backend.Contracts.Interfaces;
using AppForms.Backend.Services.Routing;
using AppForms.Shared.Common;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace AppForms.Tests.Routing;

public class BackgroundFeatureRegistryTests
{
    private readonly Mock<IFormConverterService> _mockConverterService;
    private readonly Mock<IFilterPipelineOrchestrator> _mockFilterOrchestrator;
    private readonly BackgroundFeatureRegistry _registry;

    public BackgroundFeatureRegistryTests()
    {
        _mockConverterService = new Mock<IFormConverterService>();
        _mockFilterOrchestrator = new Mock<IFilterPipelineOrchestrator>();

        _registry = new BackgroundFeatureRegistry(
            NullLogger<BackgroundFeatureRegistry>.Instance,
            _mockConverterService.Object,
            _mockFilterOrchestrator.Object
        );
    }

    [Fact]
    public void GetAllFeatureStatuses_ShouldReturnRegisteredBackgroundServices()
    {
        // Arrange
        _mockConverterService.Setup(c => c.IsClipboardListening).Returns(true);
        _mockFilterOrchestrator.Setup(f => f.IsRunning).Returns(false);

        // Act
        var statuses = _registry.GetAllFeatureStatuses();

        // Assert
        Assert.Equal(2, statuses.Count);
        
        var clipStatus = statuses.First(s => s.FeatureId == BackgroundFeatureRegistry.FeatureClipboardMonitor);
        Assert.True(clipStatus.IsRunning);
        Assert.Equal("📋", clipStatus.IconSymbol);

        var filterStatus = statuses.First(s => s.FeatureId == BackgroundFeatureRegistry.FeatureMessageFilter);
        Assert.False(filterStatus.IsRunning);
        Assert.Equal("🧹", filterStatus.IconSymbol);
    }

    [Fact]
    public void ToggleFeature_ClipboardMonitor_ShouldInvokeConverterService()
    {
        // Arrange
        var handle = new IntPtr(12345);
        _mockConverterService.Setup(c => c.StartClipboardMonitor(handle)).Returns(Result.Success());
        _mockConverterService.Setup(c => c.StopClipboardMonitor(handle)).Returns(Result.Success());

        // Act
        var startResult = _registry.ToggleFeature(BackgroundFeatureRegistry.FeatureClipboardMonitor, true, handle);
        var stopResult = _registry.ToggleFeature(BackgroundFeatureRegistry.FeatureClipboardMonitor, false, handle);

        // Assert
        Assert.True(startResult.IsSuccess);
        Assert.True(stopResult.IsSuccess);
        _mockConverterService.Verify(c => c.StartClipboardMonitor(handle), Times.Once);
        _mockConverterService.Verify(c => c.StopClipboardMonitor(handle), Times.Once);
    }

    [Fact]
    public void ToggleFeature_MessageFilter_ShouldInvokeOrchestrator()
    {
        // Act
        var startResult = _registry.ToggleFeature(BackgroundFeatureRegistry.FeatureMessageFilter, true, IntPtr.Zero);
        var stopResult = _registry.ToggleFeature(BackgroundFeatureRegistry.FeatureMessageFilter, false, IntPtr.Zero);

        // Assert
        Assert.True(startResult.IsSuccess);
        Assert.True(stopResult.IsSuccess);
        _mockFilterOrchestrator.Verify(f => f.Start(), Times.Once);
        _mockFilterOrchestrator.Verify(f => f.Stop(), Times.Once);
    }

    [Fact]
    public void ToggleFeature_UnknownFeature_ShouldReturnFailure()
    {
        // Act
        var result = _registry.ToggleFeature("unknown_service", true, IntPtr.Zero);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Contains("Không tìm thấy dịch vụ ngầm", result.Error);
    }

    [Fact]
    public void ServiceEvents_ShouldRaiseFeatureStateChanged()
    {
        // Arrange
        string? changedFeatureId = null;
        _registry.FeatureStateChanged += (_, fId) => changedFeatureId = fId;

        // Act - Simulate event from converter service
        _mockConverterService.Raise(c => c.ClipboardListeningStateChanged += null, _mockConverterService.Object, true);

        // Assert
        Assert.Equal(BackgroundFeatureRegistry.FeatureClipboardMonitor, changedFeatureId);

        // Act - Simulate event from filter orchestrator
        _mockFilterOrchestrator.Raise(f => f.StateChanged += null, _mockFilterOrchestrator.Object, true);

        // Assert
        Assert.Equal(BackgroundFeatureRegistry.FeatureMessageFilter, changedFeatureId);
    }
}
