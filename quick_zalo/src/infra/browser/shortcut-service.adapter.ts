import type { IShortcutService, CommandShortcutInfo } from '@app/ports/shortcut.port';
import type { ExtensionShortcutCommand } from '@shared/constants/shortcuts.constants';

export class ShortcutServiceAdapter implements IShortcutService {
  public onCommand(handler: (command: ExtensionShortcutCommand) => void): () => void {
    if (typeof chrome !== 'undefined' && chrome.commands?.onCommand) {
      const listener = (command: string) => {
        handler(command as ExtensionShortcutCommand);
      };
      chrome.commands.onCommand.addListener(listener);
      return () => {
        chrome.commands.onCommand.removeListener(listener);
      };
    }
    // Fallback no-op for non-extension / mock environment
    return () => {};
  }

  public async getAllShortcuts(): Promise<CommandShortcutInfo[]> {
    if (typeof chrome !== 'undefined' && chrome.commands?.getAll) {
      return new Promise((resolve) => {
        chrome.commands.getAll((commands) => {
          resolve(
            commands.map((cmd) => ({
              name: cmd.name ?? '',
              description: cmd.description,
              shortcut: cmd.shortcut,
            }))
          );
        });
      });
    }
    return [];
  }

  public async openShortcutSettings(): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      await chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
    }
  }
}
