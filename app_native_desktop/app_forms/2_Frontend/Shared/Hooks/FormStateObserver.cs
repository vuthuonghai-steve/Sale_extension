namespace AppForms.Frontend.Shared.Hooks;

public static class FormStateObserver
{
    public static void InvokeOnUI(Control control, Action action)
    {
        if (control.IsDisposed) return;

        if (control.IsHandleCreated)
        {
            if (control.InvokeRequired)
            {
                control.BeginInvoke(action);
            }
            else
            {
                action();
            }
        }
        else
        {
            try
            {
                if (!control.InvokeRequired)
                {
                    action();
                }
            }
            catch
            {
                // Bỏ qua an toàn nếu luồng nền cố cập nhật khi Form chưa tạo Handle
            }
        }
    }
}
