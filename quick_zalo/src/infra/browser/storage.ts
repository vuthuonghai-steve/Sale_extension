import type { IKeyValueStore } from '@app/ports/storage.port';

export class BrowserStorage implements IKeyValueStore {
  constructor(private area: 'local' | 'sync' = 'local') {}

  async get<T>(key: string): Promise<T | undefined> {
    const bag = await browser.storage[this.area].get(key);
    return bag[key] as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await browser.storage[this.area].set({ [key]: value });
  }

  async remove(key: string): Promise<void> {
    await browser.storage[this.area].remove(key);
  }
}
