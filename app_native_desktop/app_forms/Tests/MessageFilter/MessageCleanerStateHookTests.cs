using AppForms.Backend.Contracts.Interfaces;
using AppForms.Frontend.Screens.MessageFilter.Hooks;
using AppForms.Shared.Models.MessageFilter;
using Moq;
using Xunit;

namespace AppForms.Tests.MessageFilter;

public class MessageCleanerStateHookTests
{
    private readonly Mock<IFilterPipelineOrchestrator> _orchestratorMock;
    private readonly MessageCleanerStateHook _stateHook;

    public MessageCleanerStateHookTests()
    {
        _orchestratorMock = new Mock<IFilterPipelineOrchestrator>();
        _orchestratorMock.Setup(o => o.IsRunning).Returns(true);
        _orchestratorMock.Setup(o => o.CurrentOptions).Returns(new FilterPipelineOptions());

        _stateHook = new MessageCleanerStateHook(_orchestratorMock.Object);
    }

    [Fact]
    public void LoadInitialState_TriggersStateUpdatedEvent()
    {
        bool eventFired = false;
        bool actualRunning = false;
        FilterPipelineOptions? actualOptions = null;

        _stateHook.StateUpdated += (running, opts) =>
        {
            eventFired = true;
            actualRunning = running;
            actualOptions = opts;
        };

        _stateHook.LoadInitialState();

        Assert.True(eventFired);
        Assert.True(actualRunning);
        Assert.NotNull(actualOptions);
    }

    [Fact]
    public void ToggleService_UpdatesOptionsAndInvokesFeedback()
    {
        string? feedbackMsg = null;
        bool? feedbackSuccess = null;

        _stateHook.OperationFeedback += (msg, success) =>
        {
            feedbackMsg = msg;
            feedbackSuccess = success;
        };

        _stateHook.ToggleService(false);

        _orchestratorMock.Verify(o => o.UpdateOptions(It.Is<FilterPipelineOptions>(p => !p.EnableService)), Times.Once);
        Assert.NotNull(feedbackMsg);
        Assert.False(feedbackSuccess);
    }

    [Fact]
    public void UpdateOptions_CallsOrchestratorUpdateOptions()
    {
        var customOptions = new FilterPipelineOptions { EnableCommissionFilter = false };

        _stateHook.UpdateOptions(customOptions);

        _orchestratorMock.Verify(o => o.UpdateOptions(customOptions), Times.Once);
    }

    [Fact]
    public void ProcessManual_WhenNonEmpty_CallsOrchestratorAndInvokesReportReceived()
    {
        string rawInput = "🌷 40%-12m 🏆 032";
        var expectedReport = new FilterExecutionReport(rawInput, "🏆 032", DateTime.Now, true, 5, new[] { "Commission Filter" });

        _orchestratorMock.Setup(o => o.ProcessManual(rawInput)).Returns(expectedReport);

        FilterExecutionReport? receivedReport = null;
        _stateHook.ReportReceived += rep => receivedReport = rep;

        _stateHook.ProcessManual(rawInput);

        Assert.NotNull(receivedReport);
        Assert.Equal("🏆 032", receivedReport.CleanedText);
        Assert.True(receivedReport.IsModified);
    }

    [Fact]
    public void ProcessManual_WhenNullOrEmpty_ReturnsEmptyReportWithoutCallingOrchestrator()
    {
        FilterExecutionReport? receivedReport = null;
        _stateHook.ReportReceived += rep => receivedReport = rep;

        _stateHook.ProcessManual(string.Empty);

        Assert.NotNull(receivedReport);
        Assert.Equal(string.Empty, receivedReport.CleanedText);
        _orchestratorMock.Verify(o => o.ProcessManual(It.IsAny<string>()), Times.Never);
    }
}
