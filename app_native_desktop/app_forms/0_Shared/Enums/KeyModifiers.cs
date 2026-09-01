using System;

namespace AppForms.Shared.Enums;

/// <summary>
/// Bitmask cờ các phím bổ trợ (Modifiers) theo chuẩn Win32 RegisterHotKey
/// </summary>
[Flags]
public enum KeyModifiers : uint
{
    None = 0x0000,
    Alt = 0x0001,
    Control = 0x0002,
    Shift = 0x0004,
    Win = 0x0008,
    NoRepeat = 0x4000
}
