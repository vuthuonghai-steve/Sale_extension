using System;
using AppForms.Shared.Enums;

namespace AppForms.Shared.Models.Hotkey;

/// <summary>
/// Định nghĩa chi tiết cấu hình và hành vi của một phím tắt toàn cục trong ứng dụng (Pure Shared Model)
/// </summary>
public class HotkeyDefinition
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public KeyModifiers Modifiers { get; set; } = KeyModifiers.None;
    public VirtualKey Key { get; set; } = VirtualKey.None;
    public bool IsEnabled { get; set; } = true;
    public bool IsRegistered { get; set; } = false;
    public Action? Action { get; set; }

    public HotkeyDefinition()
    {
    }

    public HotkeyDefinition(
        string id,
        string name,
        string description,
        KeyModifiers modifiers,
        VirtualKey key,
        Action? action = null,
        string category = "General",
        bool isEnabled = true)
    {
        Id = id;
        Name = name;
        Description = description;
        Modifiers = modifiers;
        Key = key;
        Action = action;
        Category = category;
        IsEnabled = isEnabled;
    }

    public override string ToString()
    {
        var modStr = Modifiers != KeyModifiers.None ? $"{Modifiers} + " : string.Empty;
        return $"{Name} ({modStr}{Key}) - [Enabled: {IsEnabled}, Registered: {IsRegistered}]";
    }
}
