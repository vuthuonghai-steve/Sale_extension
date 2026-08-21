using AppForms.Backend.Adapters.Win32;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace AppForms.Tests.Backend;

public class Win32ClipboardListenerMultiConsumerTests
{
    [Fact]
    public void Start_WithSingleConsumer_RegistersConsumer()
    {
        var listener = new Win32ClipboardListener(NullLogger<Win32ClipboardListener>.Instance);

        bool started = listener.Start("ConsumerA");

        Assert.True(started);
        Assert.True(listener.IsListening);
        Assert.Contains("ConsumerA", listener.ActiveConsumers);

        listener.Dispose();
    }

    [Fact]
    public void Start_WithMultipleConsumers_TracksAllConsumers()
    {
        var listener = new Win32ClipboardListener(NullLogger<Win32ClipboardListener>.Instance);

        listener.Start("ConsumerA");
        listener.Start("ConsumerB");

        Assert.True(listener.IsListening);
        Assert.Equal(2, listener.ActiveConsumers.Count);
        Assert.Contains("ConsumerA", listener.ActiveConsumers);
        Assert.Contains("ConsumerB", listener.ActiveConsumers);

        listener.Dispose();
    }

    [Fact]
    public void Stop_OneConsumerWhenMultipleActive_KeepsListenerActive()
    {
        var listener = new Win32ClipboardListener(NullLogger<Win32ClipboardListener>.Instance);

        listener.Start("LeadConverter");
        listener.Start("MessageFilter");

        listener.Stop("LeadConverter");

        Assert.True(listener.IsListening);
        Assert.Single(listener.ActiveConsumers);
        Assert.Contains("MessageFilter", listener.ActiveConsumers);
        Assert.DoesNotContain("LeadConverter", listener.ActiveConsumers);

        listener.Dispose();
    }

    [Fact]
    public void Stop_AllConsumers_StopsListening()
    {
        var listener = new Win32ClipboardListener(NullLogger<Win32ClipboardListener>.Instance);

        listener.Start("LeadConverter");
        listener.Start("MessageFilter");

        listener.Stop("LeadConverter");
        listener.Stop("MessageFilter");

        Assert.False(listener.IsListening);
        Assert.Empty(listener.ActiveConsumers);

        listener.Dispose();
    }

    [Fact]
    public void Start_AfterCompleteStop_RestartsListeningSuccessfully()
    {
        var listener = new Win32ClipboardListener(NullLogger<Win32ClipboardListener>.Instance);

        listener.Start("ConsumerA");
        listener.Stop("ConsumerA");
        Assert.False(listener.IsListening);

        listener.Start("ConsumerB");
        Assert.True(listener.IsListening);
        Assert.Contains("ConsumerB", listener.ActiveConsumers);

        listener.Dispose();
    }
}
