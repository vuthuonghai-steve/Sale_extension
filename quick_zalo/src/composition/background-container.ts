import { BrowserStorage } from '@infra/browser/storage';
import { RuntimeMessageBus } from '@infra/browser/runtime-bus';
import { BrowserTabs } from '@infra/browser/tabs';
import { createConfigContainer } from './config-container';

export function createBackgroundContainer() {
  const store = new BrowserStorage('local');
  const bus = new RuntimeMessageBus();
  const tabs = new BrowserTabs();
  const config = createConfigContainer();

  return { bus, store, tabs, config };
}
