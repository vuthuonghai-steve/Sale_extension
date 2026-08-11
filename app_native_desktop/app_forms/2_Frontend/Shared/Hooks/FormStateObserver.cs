namespace AppForms.Frontend.Shared.Hooks;

public static class FormStateObserver
{
    public static void InvokeOnUI(Control control, Action action)
    {
        if (control.IsDisposed || !control.IsHandleCreated) return;

        if (control.InvokeRequired)
        {
            control.BeginInvoke(action);
        }
        else
        {
            action();
        }
    }
}
