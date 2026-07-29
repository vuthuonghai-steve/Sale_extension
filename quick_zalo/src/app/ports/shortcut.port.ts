import type { ExtensionShortcutCommand } from '@config/shortcuts.config';

export interface CommandShortcutInfo {
  name: string;
  description?: string;
  shortcut?: string;
}

export interface IShortcutService {
  /**
   * Register a listener for command shortcut execution
   */
  onCommand(handler: (command: ExtensionShortcutCommand) => void): () => void;

  /**
   * Get all registered commands with their configured shortcuts
   */
  getAllShortcuts(): Promise<CommandShortcutInfo[]>;

  /**
   * Open Chrome extension shortcuts setting page (chrome://extensions/shortcuts)
   */
  openShortcutSettings(): Promise<void>;
}
