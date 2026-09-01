using System;
using System.Collections.Generic;
using AppForms.Shared.Models.Hotkey;

namespace AppForms.Backend.Contracts.Interfaces;

/// <summary>
/// Quản trị vòng đời đăng ký, bật/tắt và phân phối sự kiện phím tắt toàn cục
/// </summary>
public interface IHotkeyManager : IDisposable
{
    /// <summary>
    /// Trạng thái lắng nghe toàn cục của toàn bộ hệ thống phím tắt
    /// </summary>
    bool IsGlobalListening { get; }

    /// <summary>
    /// Đăng ký một phím tắt mới vào hệ thống
    /// </summary>
    bool RegisterHotkey(HotkeyDefinition definition);

    /// <summary>
    /// Hủy đăng ký một phím tắt khỏi hệ thống theo HotkeyId
    /// </summary>
    bool UnregisterHotkey(string hotkeyId);

    /// <summary>
    /// Bật kích hoạt một phím tắt cụ thể
    /// </summary>
    bool EnableHotkey(string hotkeyId);

    /// <summary>
    /// Tắt kích hoạt một phím tắt cụ thể (không hủy đăng ký, chỉ chặn thực thi)
    /// </summary>
    bool DisableHotkey(string hotkeyId);

    /// <summary>
    /// Đảo trạng thái kích hoạt của một phím tắt cụ thể
    /// </summary>
    bool ToggleHotkey(string hotkeyId);

    /// <summary>
    /// Bật hoặc tắt khả năng lắng nghe toàn cục của toàn bộ phím tắt
    /// </summary>
    void SetGlobalListening(bool isListening);

    /// <summary>
    /// Lấy định nghĩa phím tắt theo Id
    /// </summary>
    HotkeyDefinition? GetHotkey(string hotkeyId);

    /// <summary>
    /// Lấy toàn bộ danh sách phím tắt hiện có trong hệ thống
    /// </summary>
    IReadOnlyList<HotkeyDefinition> GetAllHotkeys();

    /// <summary>
    /// Sự kiện phát ra khi bất kỳ phím tắt hợp lệ nào được kích hoạt
    /// </summary>
    event EventHandler<HotkeyTriggerEventArgs>? HotkeyTriggered;
}
