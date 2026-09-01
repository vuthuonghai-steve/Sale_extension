using System;
using AppForms.Backend.Contracts.Interfaces;
using AppForms.Shared.Constants;
using AppForms.Shared.Enums;
using AppForms.Shared.Models.Hotkey;
using Microsoft.Extensions.Logging;

namespace AppForms.Backend.Services.Hotkey;

/// <summary>
/// Service quản lý và kích hoạt chèn các đoạn text mẫu cố định thông qua Hotkey Manager
/// </summary>
public class TextSnippetService : ITextSnippetService
{
    private readonly IHotkeyManager _hotkeyManager;
    private readonly IInputSimulator _inputSimulator;
    private readonly ILogger<TextSnippetService> _logger;
    private bool _isInitialized;

    public TextSnippetService(
        IHotkeyManager hotkeyManager,
        IInputSimulator inputSimulator,
        ILogger<TextSnippetService> logger)
    {
        _hotkeyManager = hotkeyManager;
        _inputSimulator = inputSimulator;
        _logger = logger;
    }

    public void InitializeDefaultSnippets()
    {
        if (_isInitialized) return;
        _isInitialized = true;

        // Đăng ký phím tắt Alt + 1 để chèn dòng kẻ phân cách "========================"
        var dividerHotkey = new HotkeyDefinition(
            id: AppConstants.HotkeySnippets.DefaultDividerHotkeyId,
            name: "Chèn dòng kẻ phân cách",
            description: "Tự động gõ nhanh chuỗi '========================' tại con trỏ văn bản hiện tại",
            modifiers: KeyModifiers.Alt,
            key: VirtualKey.D1,
            action: InsertDividerLine,
            category: "Snippets",
            isEnabled: true
        );

        _hotkeyManager.RegisterHotkey(dividerHotkey);
        _logger.LogInformation("Default text snippets initialized successfully (Alt + 1 -> '{DividerLine}')", AppConstants.HotkeySnippets.DefaultDividerLine);
    }

    public void InsertSnippet(string text)
    {
        if (string.IsNullOrEmpty(text)) return;

        _logger.LogInformation("⚡ Inserting snippet: '{Snippet}' ({Length} chars)", text, text.Length);
        _inputSimulator.SendText(text);
    }

    public void InsertDividerLine()
    {
        InsertSnippet(AppConstants.HotkeySnippets.DefaultDividerLine);
    }
}
