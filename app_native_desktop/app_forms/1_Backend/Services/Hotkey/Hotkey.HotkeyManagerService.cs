using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using AppForms.Backend.Adapters.Win32;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Shared.Models.Hotkey;
using Microsoft.Extensions.Logging;

namespace AppForms.Backend.Services.Hotkey;

/// <summary>
/// Service quản lý tập trung toàn bộ phím tắt của ứng dụng, hỗ trợ bật/tắt toàn cục và từng phím độc lập
/// </summary>
public class HotkeyManagerService : IHotkeyManager
{
    private readonly Win32HotkeyListener _listener;
    private readonly ILogger<HotkeyManagerService> _logger;
    private readonly ConcurrentDictionary<string, HotkeyDefinition> _hotkeysById = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<int, string> _atomIdToHotkeyId = new();
    private readonly ConcurrentDictionary<string, int> _hotkeyIdToAtomId = new(StringComparer.OrdinalIgnoreCase);
    private readonly object _lock = new();

    private int _atomSequence = 9000;
    private bool _isGlobalListening = true;
    private bool _isDisposed;

    public event EventHandler<HotkeyTriggerEventArgs>? HotkeyTriggered;

    public bool IsGlobalListening
    {
        get
        {
            lock (_lock)
            {
                return _isGlobalListening;
            }
        }
    }

    public HotkeyManagerService(
        Win32HotkeyListener listener,
        ILogger<HotkeyManagerService> logger)
    {
        _listener = listener;
        _logger = logger;
        _listener.HotkeyMessageReceived += OnHotkeyMessageReceived;
    }

    public bool RegisterHotkey(HotkeyDefinition definition)
    {
        if (definition == null || string.IsNullOrWhiteSpace(definition.Id))
        {
            _logger.LogWarning("Cannot register hotkey: Definition or HotkeyId is empty");
            return false;
        }

        lock (_lock)
        {
            if (_isDisposed)
            {
                _logger.LogWarning("Cannot register hotkey '{HotkeyId}': HotkeyManagerService is disposed", definition.Id);
                return false;
            }

            // If already registered, unregister first
            if (_hotkeysById.ContainsKey(definition.Id))
            {
                UnregisterHotkey(definition.Id);
            }

            var atomId = Interlocked.Increment(ref _atomSequence);
            var registeredWithOs = false;

            if (_isGlobalListening && definition.IsEnabled)
            {
                registeredWithOs = _listener.RegisterHotkey(atomId, definition.Modifiers, definition.Key);
            }

            definition.IsRegistered = registeredWithOs;
            _hotkeysById[definition.Id] = definition;
            _atomIdToHotkeyId[atomId] = definition.Id;
            _hotkeyIdToAtomId[definition.Id] = atomId;

            _logger.LogInformation(
                "Hotkey registered. Id: '{HotkeyId}', Name: '{Name}', Shortcut: '{Modifiers}+{Key}', Enabled: {Enabled}, RegisteredOS: {RegisteredOS}",
                definition.Id, definition.Name, definition.Modifiers, definition.Key, definition.IsEnabled, registeredWithOs);

            return true;
        }
    }

    public bool UnregisterHotkey(string hotkeyId)
    {
        if (string.IsNullOrWhiteSpace(hotkeyId)) return false;

        lock (_lock)
        {
            if (_hotkeyIdToAtomId.TryRemove(hotkeyId, out var atomId))
            {
                _atomIdToHotkeyId.TryRemove(atomId, out _);
                _listener.UnregisterHotkey(atomId);
            }

            if (_hotkeysById.TryRemove(hotkeyId, out var def))
            {
                def.IsRegistered = false;
                _logger.LogInformation("Hotkey unregistered: '{HotkeyId}'", hotkeyId);
                return true;
            }

            return false;
        }
    }

    public bool EnableHotkey(string hotkeyId)
    {
        if (string.IsNullOrWhiteSpace(hotkeyId)) return false;

        lock (_lock)
        {
            if (!_hotkeysById.TryGetValue(hotkeyId, out var def))
            {
                _logger.LogWarning("EnableHotkey failed: Hotkey '{HotkeyId}' not found", hotkeyId);
                return false;
            }

            def.IsEnabled = true;

            if (_isGlobalListening && !def.IsRegistered)
            {
                if (_hotkeyIdToAtomId.TryGetValue(hotkeyId, out var atomId))
                {
                    def.IsRegistered = _listener.RegisterHotkey(atomId, def.Modifiers, def.Key);
                }
            }

            _logger.LogInformation("Hotkey '{HotkeyId}' enabled. Registered with OS: {IsRegistered}", hotkeyId, def.IsRegistered);
            return true;
        }
    }

    public bool DisableHotkey(string hotkeyId)
    {
        if (string.IsNullOrWhiteSpace(hotkeyId)) return false;

        lock (_lock)
        {
            if (!_hotkeysById.TryGetValue(hotkeyId, out var def))
            {
                _logger.LogWarning("DisableHotkey failed: Hotkey '{HotkeyId}' not found", hotkeyId);
                return false;
            }

            def.IsEnabled = false;

            if (def.IsRegistered)
            {
                if (_hotkeyIdToAtomId.TryGetValue(hotkeyId, out var atomId))
                {
                    _listener.UnregisterHotkey(atomId);
                }
                def.IsRegistered = false;
            }

            _logger.LogInformation("Hotkey '{HotkeyId}' disabled and unhooked from OS", hotkeyId);
            return true;
        }
    }

    public bool ToggleHotkey(string hotkeyId)
    {
        if (string.IsNullOrWhiteSpace(hotkeyId)) return false;

        lock (_lock)
        {
            if (!_hotkeysById.TryGetValue(hotkeyId, out var def))
            {
                return false;
            }

            return def.IsEnabled ? DisableHotkey(hotkeyId) : EnableHotkey(hotkeyId);
        }
    }

    public void SetGlobalListening(bool isListening)
    {
        lock (_lock)
        {
            if (_isGlobalListening == isListening) return;

            _isGlobalListening = isListening;

            if (_isGlobalListening)
            {
                _logger.LogInformation("Global hotkey listening ENABLED. Re-registering active hotkeys...");
                foreach (var kvp in _hotkeysById)
                {
                    var def = kvp.Value;
                    if (def.IsEnabled && !def.IsRegistered)
                    {
                        if (_hotkeyIdToAtomId.TryGetValue(def.Id, out var atomId))
                        {
                            def.IsRegistered = _listener.RegisterHotkey(atomId, def.Modifiers, def.Key);
                        }
                    }
                }
            }
            else
            {
                _logger.LogInformation("Global hotkey listening DISABLED. Unhooking all hotkeys from OS...");
                _listener.UnregisterAll();
                foreach (var def in _hotkeysById.Values)
                {
                    def.IsRegistered = false;
                }
            }
        }
    }

    public HotkeyDefinition? GetHotkey(string hotkeyId)
    {
        if (string.IsNullOrWhiteSpace(hotkeyId)) return null;
        _hotkeysById.TryGetValue(hotkeyId, out var def);
        return def;
    }

    public IReadOnlyList<HotkeyDefinition> GetAllHotkeys()
    {
        return _hotkeysById.Values.ToList();
    }

    private void OnHotkeyMessageReceived(int atomId)
    {
        if (!_atomIdToHotkeyId.TryGetValue(atomId, out var hotkeyId))
        {
            _logger.LogWarning("Received hotkey message for unknown AtomId: {AtomId}", atomId);
            return;
        }

        if (!_hotkeysById.TryGetValue(hotkeyId, out var def))
        {
            _logger.LogWarning("Received hotkey message but definition not found for HotkeyId: '{HotkeyId}'", hotkeyId);
            return;
        }

        if (!_isGlobalListening || !def.IsEnabled)
        {
            _logger.LogDebug("Ignored hotkey '{HotkeyId}': GlobalListening={Global}, IsEnabled={Enabled}", hotkeyId, _isGlobalListening, def.IsEnabled);
            return;
        }

        _logger.LogInformation("⚡ Hotkey triggered: '{HotkeyId}' ({Name})", def.Id, def.Name);

        try
        {
            if (def.Action != null)
            {
                ThreadPool.UnsafeQueueUserWorkItem(_ =>
                {
                    try
                    {
                        def.Action();
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error occurred while executing Action callback for hotkey '{HotkeyId}'", def.Id);
                    }
                }, null);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while dispatching Action callback for hotkey '{HotkeyId}'", def.Id);
        }

        try
        {
            HotkeyTriggered?.Invoke(this, new HotkeyTriggerEventArgs(def.Id, def.Modifiers, def.Key));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while raising HotkeyTriggered event for hotkey '{HotkeyId}'", def.Id);
        }
    }

    public void Dispose()
    {
        lock (_lock)
        {
            if (_isDisposed) return;
            _isDisposed = true;

            _listener.HotkeyMessageReceived -= OnHotkeyMessageReceived;
            _listener.Dispose();
            _hotkeysById.Clear();
            _atomIdToHotkeyId.Clear();
            _hotkeyIdToAtomId.Clear();

            _logger.LogInformation("HotkeyManagerService disposed successfully");
        }

        GC.SuppressFinalize(this);
    }
}
