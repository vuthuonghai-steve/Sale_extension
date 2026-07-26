import { BrowserStorage } from '@infra/browser/storage';
import { RuntimeMessageBus } from '@infra/browser/runtime-bus';
import { BrowserTabs } from '@infra/browser/tabs';

export function createBackgroundContainer() {
  const store = new BrowserStorage('local');
  const bus = new RuntimeMessageBus();
  const tabs = new BrowserTabs();

  return { bus, store, tabs };
}
