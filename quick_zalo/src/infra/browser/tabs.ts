import type { ITabs } from '@app/ports/tabs.port';

export class BrowserTabs implements ITabs {
  async getActive(): Promise<{ id: number; url?: string } | null> {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab || tab.id === undefined) return null;
    return { id: tab.id, url: tab.url };
  }

  async sendToTab<T>(tabId: number, message: unknown): Promise<T> {
    return browser.tabs.sendMessage(tabId, message) as Promise<T>;
  }
}
