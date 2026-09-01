using System;
using System.Collections.Generic;
using System.Linq;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Frontend.Screens.HotkeyManager.Models;
using AppForms.Shared.Enums;
using AppForms.Shared.Models.Hotkey;
using Microsoft.Extensions.Logging;

namespace AppForms.Frontend.Screens.HotkeyManager.Hooks;

/// <summary>
/// StateHook quản lý trạng thái, thao tác bật/tắt và kiểm thử phím tắt của màn hình Hotkey Manager
/// Tuyệt đối KHÔNG chứa UI Controls (WinForms).
/// </summary>
public class HotkeyManagerStateHook : IDisposable
{
    private readonly IHotkeyManager _hotkeyManager;
    private readonly ITextSnippetService _snippetService;
    private readonly ILogger<HotkeyManagerStateHook> _logger;
    private bool _isDisposed;

    public HotkeyManagerFormModel CurrentModel { get; private set; } = null!;

    public event Action? StateUpdated;
    public event Action<string, bool>? FeedbackReceived;

    public HotkeyManagerStateHook(
        IHotkeyManager hotkeyManager,
        ITextSnippetService snippetService,
        ILogger<HotkeyManagerStateHook> logger)
    {
        _hotkeyManager = hotkeyManager;
        _snippetService = snippetService;
        _logger = logger;

        _hotkeyManager.HotkeyTriggered += OnHotkeyTriggered;

        LoadData();
    }

    private void OnHotkeyTriggered(object? sender, HotkeyTriggerEventArgs args)
    {
        _logger.LogInformation("StateHook: Nhận sự kiện HotkeyTriggered: {HotkeyId}", args.HotkeyId);
        LoadData();
    }

    public void Dispose()
    {
        if (_isDisposed) return;
        _isDisposed = true;

        _hotkeyManager.HotkeyTriggered -= OnHotkeyTriggered;
        StateUpdated = null;
        FeedbackReceived = null;
        GC.SuppressFinalize(this);
    }

    public void LoadData()
    {
        var allHotkeys = _hotkeyManager.GetAllHotkeys();
        var isGlobalListening = _hotkeyManager.IsGlobalListening;

        var items = allHotkeys.Select(def =>
        {
            var comboText = FormatKeyCombination(def.Modifiers, def.Key);
            return new HotkeyItemViewModel(
                Id: def.Id,
                Name: def.Name,
                Description: def.Description,
                Category: def.Category,
                Modifiers: def.Modifiers,
                Key: def.Key,
                KeyCombinationText: comboText,
                IsEnabled: def.IsEnabled,
                IsRegistered: def.IsRegistered
            );
        }).ToList();

        var activeCount = items.Count(i => i.IsEnabled && isGlobalListening);
        var totalCount = items.Count;

        var statusSummary = isGlobalListening
            ? $"🟢 Hệ thống phím tắt đang HOẠT ĐỘNG ({activeCount}/{totalCount} phím kích hoạt)"
            : "⚪ Hệ thống phím tắt đang TẠM DỪNG TOÀN CỤC";

        CurrentModel = new HotkeyManagerFormModel(
            IsGlobalListening: isGlobalListening,
            ActiveHotkeysCount: activeCount,
            TotalHotkeysCount: totalCount,
            StatusSummary: statusSummary,
            Items: items
        );

        StateUpdated?.Invoke();
    }

    public void ToggleGlobalListening()
    {
        var newState = !_hotkeyManager.IsGlobalListening;
        _logger.LogInformation("StateHook: ToggleGlobalListening -> {NewState}", newState);
        _hotkeyManager.SetGlobalListening(newState);
        LoadData();

        var msg = newState
            ? "🟢 Đã BẬT lắng nghe phím tắt toàn hệ thống!"
            : "⚪ Đã TẮT lắng nghe phím tắt toàn hệ thống.";
        FeedbackReceived?.Invoke(msg, newState);
    }

    public void ToggleHotkey(string hotkeyId)
    {
        if (string.IsNullOrWhiteSpace(hotkeyId)) return;

        _logger.LogInformation("StateHook: ToggleHotkey -> {HotkeyId}", hotkeyId);
        var result = _hotkeyManager.ToggleHotkey(hotkeyId);
        LoadData();

        var hotkey = _hotkeyManager.GetHotkey(hotkeyId);
        if (hotkey != null)
        {
            var statusStr = hotkey.IsEnabled ? "BẬT" : "TẮT";
            FeedbackReceived?.Invoke($"Đã {statusStr} phím tắt [{hotkey.Name}].", hotkey.IsEnabled);
        }
    }

    public void TestTriggerHotkey(string hotkeyId)
    {
        if (string.IsNullOrWhiteSpace(hotkeyId)) return;

        var hotkey = _hotkeyManager.GetHotkey(hotkeyId);
        if (hotkey == null)
        {
            FeedbackReceived?.Invoke("❌ Không tìm thấy thông tin phím tắt cần thử nghiệm.", false);
            return;
        }

        _logger.LogInformation("StateHook: TestTriggerHotkey -> {HotkeyId}", hotkeyId);

        try
        {
            hotkey.Action?.Invoke();
            FeedbackReceived?.Invoke($"⚡ Đã kích hoạt thử nghiệm hành động cho phím [{hotkey.Name}]!", true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi chạy thử phím tắt {HotkeyId}", hotkeyId);
            FeedbackReceived?.Invoke($"❌ Lỗi thực thi: {ex.Message}", false);
        }
    }

    private static string FormatKeyCombination(KeyModifiers modifiers, VirtualKey key)
    {
        var parts = new List<string>();

        if (modifiers.HasFlag(KeyModifiers.Control)) parts.Add("Ctrl");
        if (modifiers.HasFlag(KeyModifiers.Alt)) parts.Add("Alt");
        if (modifiers.HasFlag(KeyModifiers.Shift)) parts.Add("Shift");
        if (modifiers.HasFlag(KeyModifiers.Win)) parts.Add("Win");

        var keyName = key.ToString();
        if (keyName.StartsWith("D") && keyName.Length == 2 && char.IsDigit(keyName[1]))
        {
            keyName = keyName[1].ToString();
        }

        parts.Add(keyName);
        return string.Join(" + ", parts);
    }
}
