import { useState, useEffect, useCallback } from 'react';
import { ShortcutServiceAdapter } from '@infra/browser/shortcut-service.adapter';
import type { CommandShortcutInfo } from '@app/ports/shortcut.port';

export interface UseExtensionShortcutsReturn {
  shortcuts: CommandShortcutInfo[];
  loading: boolean;
  openShortcutSettings: () => Promise<void>;
  refreshShortcuts: () => Promise<void>;
}

const shortcutAdapter = new ShortcutServiceAdapter();

export function useExtensionShortcuts(): UseExtensionShortcutsReturn {
  const [shortcuts, setShortcuts] = useState<CommandShortcutInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshShortcuts = useCallback(async () => {
    setLoading(true);
    try {
      const list = await shortcutAdapter.getAllShortcuts();
      setShortcuts(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshShortcuts();
  }, [refreshShortcuts]);

  const openShortcutSettings = useCallback(async () => {
    await shortcutAdapter.openShortcutSettings();
  }, []);

  return {
    shortcuts,
    loading,
    openShortcutSettings,
    refreshShortcuts,
  };
}
