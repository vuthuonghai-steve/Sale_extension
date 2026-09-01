using AppForms.Shared.Enums;

namespace AppForms.Backend.Contracts.Interfaces;

/// <summary>
/// Giao diện mô phỏng thao tác nhập liệu bàn phím an toàn trên môi trường Windows
/// </summary>
public interface IInputSimulator
{
    /// <summary>
    /// Gõ trực tiếp chuỗi ký tự Unicode vào cửa sổ đang focus mà không ảnh hưởng Clipboard
    /// </summary>
    void SendText(string text);

    /// <summary>
    /// Gửi một tổ hợp phím giả lập
    /// </summary>
    void SendKey(VirtualKey key, KeyModifiers modifiers = KeyModifiers.None);
}
