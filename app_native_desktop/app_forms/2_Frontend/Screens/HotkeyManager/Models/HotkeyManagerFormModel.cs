using System;
using System.Collections.Generic;
using AppForms.Shared.Enums;

namespace AppForms.Frontend.Screens.HotkeyManager.Models;

/// <summary>
/// DTO Model đại diện cho một thẻ phím tắt hiển thị trên giao diện người dùng
/// </summary>
public record HotkeyItemViewModel(
    string Id,
    string Name,
    string Description,
    string Category,
    KeyModifiers Modifiers,
    VirtualKey Key,
    string KeyCombinationText,
    bool IsEnabled,
    bool IsRegistered
);

/// <summary>
/// State Model tổng thể của màn hình Hotkey Manager
/// </summary>
public record HotkeyManagerFormModel(
    bool IsGlobalListening,
    int ActiveHotkeysCount,
    int TotalHotkeysCount,
    string StatusSummary,
    IReadOnlyList<HotkeyItemViewModel> Items
);
