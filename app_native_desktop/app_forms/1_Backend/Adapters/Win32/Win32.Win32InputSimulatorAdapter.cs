using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Shared.Enums;
using Microsoft.Extensions.Logging;

namespace AppForms.Backend.Adapters.Win32;

/// <summary>
/// Adapter Win32 thực hiện mô phỏng nhập liệu bàn phím bằng SendInput API chuẩn Unicode
/// </summary>
public class Win32InputSimulatorAdapter : IInputSimulator
{
    private static readonly int SizeOfInput = Marshal.SizeOf(typeof(NativeMethods.INPUT));
    private readonly ILogger<Win32InputSimulatorAdapter> _logger;

    public Win32InputSimulatorAdapter(ILogger<Win32InputSimulatorAdapter> logger)
    {
        _logger = logger;
    }

    public void SendText(string text)
    {
        if (string.IsNullOrEmpty(text))
        {
            return;
        }

        try
        {
            // 1. Nạp chuỗi cần chèn lên Clipboard hệ thống một cách an toàn
            var writeSuccess = Win32ClipboardAdapter.SafeWriteClipboardText(text);
            if (!writeSuccess)
            {
                _logger.LogWarning("Không thể ghi dữ liệu vào Clipboard để thực hiện chèn nhanh.");
                return;
            }

            // 2. Nhả toàn bộ các phím modifier (Alt, Shift, Win...) trước khi dán
            ReleaseModifierKeys();

            // 3. Bắn chuỗi phím atomic: Nhấn Ctrl + V -> Nhả Ctrl
            var inputs = new[]
            {
                CreateKeyInput(0x11, false), // VK_CONTROL KeyDown
                CreateKeyInput(0x56, false), // 'V' (0x56) KeyDown
                CreateKeyInput(0x56, true),  // 'V' (0x56) KeyUp
                CreateKeyInput(0x11, true)   // VK_CONTROL KeyUp
            };

            var sent = NativeMethods.SendInput((uint)inputs.Length, inputs, SizeOfInput);

            if (sent == 0)
            {
                var errorCode = Marshal.GetLastWin32Error();
                _logger.LogWarning("SendInput failed to send Ctrl+V paste. Win32 Error: {ErrorCode}", errorCode);
            }
            else
            {
                _logger.LogDebug("Successfully inserted text snippet via Atomic Clipboard + Ctrl+V");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred during Win32 SendText simulation");
        }
    }


    private static void ReleaseModifierKeys()
    {
        var releaseInputs = new[]
        {
            CreateKeyInput(0x12, true), // VK_MENU (Alt) KeyUp
            CreateKeyInput(0x11, true), // VK_CONTROL KeyUp
            CreateKeyInput(0x10, true), // VK_SHIFT KeyUp
            CreateKeyInput(0x5B, true), // VK_LWIN KeyUp
            CreateKeyInput(0x5C, true)  // VK_RWIN KeyUp
        };
        NativeMethods.SendInput((uint)releaseInputs.Length, releaseInputs, SizeOfInput);
    }


    public void SendKey(VirtualKey key, KeyModifiers modifiers = KeyModifiers.None)
    {
        try
        {
            var inputs = new List<NativeMethods.INPUT>();

            // Press Modifiers Down
            if (modifiers.HasFlag(KeyModifiers.Control))
                inputs.Add(CreateKeyInput(0x11, false)); // VK_CONTROL
            if (modifiers.HasFlag(KeyModifiers.Alt))
                inputs.Add(CreateKeyInput(0x12, false)); // VK_MENU
            if (modifiers.HasFlag(KeyModifiers.Shift))
                inputs.Add(CreateKeyInput(0x10, false)); // VK_SHIFT
            if (modifiers.HasFlag(KeyModifiers.Win))
                inputs.Add(CreateKeyInput(0x5B, false)); // VK_LWIN

            // Press Target Key Down & Up
            inputs.Add(CreateKeyInput((ushort)key, false));
            inputs.Add(CreateKeyInput((ushort)key, true));

            // Release Modifiers Up (reverse order)
            if (modifiers.HasFlag(KeyModifiers.Win))
                inputs.Add(CreateKeyInput(0x5B, true));
            if (modifiers.HasFlag(KeyModifiers.Shift))
                inputs.Add(CreateKeyInput(0x10, true));
            if (modifiers.HasFlag(KeyModifiers.Alt))
                inputs.Add(CreateKeyInput(0x12, true));
            if (modifiers.HasFlag(KeyModifiers.Control))
                inputs.Add(CreateKeyInput(0x11, true));

            var inputArray = inputs.ToArray();
            NativeMethods.SendInput((uint)inputArray.Length, inputArray, SizeOfInput);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error occurred during Win32 SendKey simulation");
        }
    }

    private static NativeMethods.INPUT CreateKeyInput(ushort vkCode, bool isKeyUp)
    {
        return new NativeMethods.INPUT
        {
            type = NativeMethods.INPUT_KEYBOARD,
            u = new NativeMethods.InputUnion
            {
                ki = new NativeMethods.KEYBDINPUT
                {
                    wVk = vkCode,
                    wScan = 0,
                    dwFlags = isKeyUp ? NativeMethods.KEYEVENTF_KEYUP : 0,
                    time = 0,
                    dwExtraInfo = UIntPtr.Zero
                }
            }
        };
    }
}
