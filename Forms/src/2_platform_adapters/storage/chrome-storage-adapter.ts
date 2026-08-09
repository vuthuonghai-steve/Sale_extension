import { DEFAULT_STORAGE_DATA, type StorageSchema } from '@contracts';

export class ChromeStorageAdapter {
  public async get<K extends keyof StorageSchema>(key: K): Promise<StorageSchema[K]> {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const res = await chrome.storage.local.get(key as string);
      return (res[key as string] ?? DEFAULT_STORAGE_DATA[key]) as StorageSchema[K];
    }
    const raw = localStorage.getItem(`forms_${key as string}`);
    return raw ? (JSON.parse(raw) as StorageSchema[K]) : DEFAULT_STORAGE_DATA[key];
  }

  public async getAll(): Promise<StorageSchema> {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const res = await chrome.storage.local.get(null);
      return {
        ...DEFAULT_STORAGE_DATA,
        ...res,
      };
    }

    return DEFAULT_STORAGE_DATA;
  }

  public async set<K extends keyof StorageSchema>(key: K, value: StorageSchema[K]): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [key]: value });
      return;
    }
    localStorage.setItem(`forms_${key as string}`, JSON.stringify(value));
  }

  public async clear(): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.clear();
      return;
    }
    localStorage.clear();
  }
}

export const storageAdapter = new ChromeStorageAdapter();
