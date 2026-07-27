import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShortcutServiceAdapter } from './shortcut-service.adapter';
import { EXTENSION_SHORTCUTS } from '@shared/constants/shortcuts.constants';

describe('ShortcutServiceAdapter Infra Adapter', () => {
  let adapter: ShortcutServiceAdapter;

  beforeEach(() => {
    adapter = new ShortcutServiceAdapter();
  });

  it('should return empty list when chrome.commands is undefined in test environment', async () => {
    const shortcuts = await adapter.getAllShortcuts();
    expect(Array.isArray(shortcuts)).toBe(true);
  });

  it('should register listener on chrome.commands.onCommand if present', () => {
    const addListenerMock = vi.fn();
    const removeListenerMock = vi.fn();

    (globalThis as any).chrome = {
      commands: {
        onCommand: {
          addListener: addListenerMock,
          removeListener: removeListenerMock,
        },
      },
    };

    const handler = vi.fn();
    const unsubscribe = adapter.onCommand(handler);

    expect(addListenerMock).toHaveBeenCalledTimes(1);

    // Simulate command trigger
    const listenerCallback = addListenerMock.mock.calls[0][0];
    listenerCallback(EXTENSION_SHORTCUTS.TOGGLE_SIDEPANEL);

    expect(handler).toHaveBeenCalledWith(EXTENSION_SHORTCUTS.TOGGLE_SIDEPANEL);

    // Unsubscribe test
    unsubscribe();
    expect(removeListenerMock).toHaveBeenCalledTimes(1);

    // Clean mock
    delete (globalThis as any).chrome;
  });

  it('should call chrome.tabs.create when opening shortcut settings', async () => {
    const createTabMock = vi.fn().mockResolvedValue({});
    (globalThis as any).chrome = {
      tabs: {
        create: createTabMock,
      },
    };

    await adapter.openShortcutSettings();
    expect(createTabMock).toHaveBeenCalledWith({ url: 'chrome://extensions/shortcuts' });

    delete (globalThis as any).chrome;
  });
});
