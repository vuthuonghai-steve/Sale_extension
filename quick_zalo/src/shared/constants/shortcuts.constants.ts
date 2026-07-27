export const EXTENSION_SHORTCUTS = {
  TOGGLE_SIDEPANEL: 'toggle-sidepanel',
  EXTRACT_CURRENT_MESSAGE: 'extract-current-message',
  EXTRACT_CHAT_ALT_A: 'extract-chat-alt-a',
  QUICK_SEARCH_CONTACT: 'quick-search-contact',
} as const;

export type ExtensionShortcutCommand =
  | (typeof EXTENSION_SHORTCUTS)[keyof typeof EXTENSION_SHORTCUTS]
  | '_execute_action';

export interface ShortcutDefinition {
  name: ExtensionShortcutCommand;
  description: string;
  defaultKey: {
    default: string;
    mac?: string;
  };
}

export const SHORTCUT_DEFINITIONS: Record<ExtensionShortcutCommand, ShortcutDefinition> = {
  _execute_action: {
    name: '_execute_action',
    description: 'Mở nhanh ứng dụng Quick Zalo Extension',
    defaultKey: { default: 'Alt+Shift+Z', mac: 'Alt+Shift+Z' },
  },
  'toggle-sidepanel': {
    name: 'toggle-sidepanel',
    description: 'Bật/Tắt Side Panel Quick Zalo trên tab hiện tại',
    defaultKey: { default: 'Alt+Shift+S', mac: 'Alt+Shift+S' },
  },
  'extract-current-message': {
    name: 'extract-current-message',
    description: 'Trích xuất nội dung tin nhắn Zalo đang chọn',
    defaultKey: { default: 'Alt+Shift+E', mac: 'Alt+Shift+E' },
  },
  'extract-chat-alt-a': {
    name: 'extract-chat-alt-a',
    description: 'Trích xuất toàn bộ tin nhắn tại giao diện chat hiện tại (Alt+A)',
    defaultKey: { default: 'Alt+A', mac: 'Alt+A' },
  },
  'quick-search-contact': {
    name: 'quick-search-contact',
    description: 'Mở ô tìm kiếm nhanh khách hàng trên Zalo',
    defaultKey: { default: 'Alt+Shift+F', mac: 'Alt+Shift+F' },
  },
};
