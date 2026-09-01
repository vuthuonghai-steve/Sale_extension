using System;
using AppForms.Shared.Enums;

namespace AppForms.Shared.Models.Hotkey;

/// <summary>
/// Dữ liệu sự kiện phát ra khi một phím tắt toàn cục được kích hoạt
/// </summary>
public class HotkeyTriggerEventArgs : EventArgs
{
    public string HotkeyId { get; }
    public KeyModifiers Modifiers { get; }
    public VirtualKey Key { get; }
    public DateTime TimestampUtc { get; }

    public HotkeyTriggerEventArgs(string hotkeyId, KeyModifiers modifiers, VirtualKey key)
    {
        HotkeyId = hotkeyId;
        Modifiers = modifiers;
        Key = key;
        TimestampUtc = DateTime.UtcNow;
    }
}
