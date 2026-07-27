import { BrowserStorage } from '@infra/browser/storage';
import { RuntimeMessageBus } from '@infra/browser/runtime-bus';
import { BrowserTabs } from '@infra/browser/tabs';
import { ShortcutServiceAdapter } from '@infra/browser/shortcut-service.adapter';
import { createConfigContainer } from './config-container';

export function createBackgroundContainer() {
  const store = new BrowserStorage('local');
  const bus = new RuntimeMessageBus();
  const tabs = new BrowserTabs();
  const shortcuts = new ShortcutServiceAdapter();
  const config = createConfigContainer();

  return { bus, store, tabs, shortcuts, config };
}

