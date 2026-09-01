using System;
using System.Collections.Concurrent;
using System.Runtime.InteropServices;
using AppForms.Shared.Constants;
using AppForms.Shared.Enums;
using Microsoft.Extensions.Logging;

namespace AppForms.Backend.Adapters.Win32;

/// <summary>
/// NativeWindow ẩn chuyên lắng nghe message WM_HOTKEY từ Windows Message Pump
/// </summary>
public class Win32HotkeyListener : System.Windows.Forms.NativeWindow, IDisposable
{
    private readonly ILogger<Win32HotkeyListener> _logger;
    private readonly ConcurrentDictionary<int, (KeyModifiers Modifiers, VirtualKey Key)> _registeredHotkeys = new();
    private readonly object _lock = new();
    private bool _isDisposed;

    public event Action<int>? HotkeyMessageReceived;

    public Win32HotkeyListener(ILogger<Win32HotkeyListener> logger)
    {
        _logger = logger;
        CreateHandle(new System.Windows.Forms.CreateParams
        {
            Caption = "AppForms_HotkeyListener_HiddenWindow",
            Style = 0
        });
    }

    public bool RegisterHotkey(int atomId, KeyModifiers modifiers, VirtualKey key)
    {
        lock (_lock)
        {
            if (_isDisposed || Handle == IntPtr.Zero)
            {
                _logger.LogWarning("Cannot register hotkey ID {AtomId}: Window handle is invalid or disposed", atomId);
                return false;
            }

            // Unregister previous hotkey if registered under this atomId
            if (_registeredHotkeys.ContainsKey(atomId))
            {
                NativeMethods.UnregisterHotKey(Handle, atomId);
                _registeredHotkeys.TryRemove(atomId, out _);
            }

            // Luôn thêm cờ NoRepeat (MOD_NOREPEAT = 0x4000) để tránh spam lặp lại khi đè giữ phím
            var fsModifiers = (uint)modifiers | (uint)KeyModifiers.NoRepeat;
            var success = NativeMethods.RegisterHotKey(Handle, atomId, fsModifiers, (uint)key);
            if (success)
            {
                _registeredHotkeys[atomId] = (modifiers, key);
                _logger.LogInformation("Successfully registered Win32 Hotkey. AtomId: {AtomId}, Modifiers: {Modifiers}, Key: {Key}", atomId, modifiers, key);
                return true;
            }


            var err = Marshal.GetLastWin32Error();
            _logger.LogError("Failed to register Win32 Hotkey. AtomId: {AtomId}, Modifiers: {Modifiers}, Key: {Key}, Win32 Error: {ErrorCode}", atomId, modifiers, key, err);
            return false;
        }
    }

    public bool UnregisterHotkey(int atomId)
    {
        lock (_lock)
        {
            if (Handle == IntPtr.Zero) return false;

            if (_registeredHotkeys.TryRemove(atomId, out _))
            {
                var success = NativeMethods.UnregisterHotKey(Handle, atomId);
                _logger.LogInformation("Unregistered Win32 Hotkey AtomId: {AtomId}, Result: {Success}", atomId, success);
                return success;
            }

            return false;
        }
    }

    public void UnregisterAll()
    {
        lock (_lock)
        {
            if (Handle == IntPtr.Zero) return;

            foreach (var atomId in _registeredHotkeys.Keys)
            {
                NativeMethods.UnregisterHotKey(Handle, atomId);
            }
            _registeredHotkeys.Clear();
            _logger.LogInformation("All Win32 hotkeys have been unregistered");
        }
    }

    protected override void WndProc(ref System.Windows.Forms.Message m)
    {
        if (m.Msg == AppConstants.Win32Messages.WM_HOTKEY)
        {
            var atomId = m.WParam.ToInt32();
            _logger.LogDebug("Received WM_HOTKEY for AtomId: {AtomId}", atomId);
            try
            {
                HotkeyMessageReceived?.Invoke(atomId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while handling HotkeyMessageReceived callback for AtomId: {AtomId}", atomId);
            }
        }

        base.WndProc(ref m);
    }

    public void Dispose()
    {
        lock (_lock)
        {
            if (_isDisposed) return;
            _isDisposed = true;

            UnregisterAll();
            HotkeyMessageReceived = null;
        }

        DestroyHandle();
        GC.SuppressFinalize(this);
    }
}
