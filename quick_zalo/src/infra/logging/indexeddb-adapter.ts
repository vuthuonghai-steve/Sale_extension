import type { AgenticLogEntry } from '../../shared/types/evlog.types';

export interface IndexedDBAdapterOptions {
  dbName?: string;
  storeName?: string;
  capacity?: number;
}

export class IndexedDBAdapter {
  private dbName: string;
  private storeName: string;
  private capacity: number;
  private inMemoryFallback: AgenticLogEntry[] = [];
  private db: IDBDatabase | null = null;
  private isDBAvailable: boolean = true;
  private isInitializing: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor(options?: IndexedDBAdapterOptions) {
    this.dbName = options?.dbName ?? 'EvlogDatabase';
    this.storeName = options?.storeName ?? 'agentic_logs';
    this.capacity = options?.capacity ?? 5000;

    this.checkIndexedDBAvailability();
  }

  private checkIndexedDBAvailability(): void {
    try {
      this.isDBAvailable = typeof indexedDB !== 'undefined' && indexedDB !== null;
    } catch {
      this.isDBAvailable = false;
    }
  }

  private async getDB(): Promise<IDBDatabase | null> {
    if (!this.isDBAvailable) return null;
    if (this.db) return this.db;
    if (this.initPromise) {
      await this.initPromise;
      return this.db;
    }

    this.isInitializing = true;
    this.initPromise = new Promise((resolve) => {
      try {
        const request = indexedDB.open(this.dbName, 1);
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, {
              keyPath: 'id',
              autoIncrement: true,
            });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('level', 'level', { unique: false });
            store.createIndex('trace_id', 'trace_id', { unique: false });
          }
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          this.isInitializing = false;
          resolve();
        };

        request.onerror = (err) => {
          console.warn('[IndexedDBAdapter] Failed to open IndexedDB, using fallback:', err);
          this.isDBAvailable = false;
          this.isInitializing = false;
          resolve();
        };
      } catch (err) {
        console.warn('[IndexedDBAdapter] IndexedDB error, using fallback:', err);
        this.isDBAvailable = false;
        this.isInitializing = false;
        resolve();
      }
    });

    await this.initPromise;
    return this.db;
  }

  /**
   * Pushes log entry to IndexedDB (or in-memory fallback).
   */
  public async push(entry: AgenticLogEntry): Promise<void> {
    // In-memory update for fast access
    if (this.inMemoryFallback.length >= this.capacity) {
      this.evictOldestInMemory();
    }
    this.inMemoryFallback.push(entry);

    const db = await this.getDB();
    if (!db) return;

    try {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      store.add(entry);

      transaction.onerror = (err) => {
        console.warn('[IndexedDBAdapter] Transaction error:', err);
      };
    } catch (err) {
      console.warn('[IndexedDBAdapter] Storage write failed, falling back to memory:', err);
    }
  }

  private evictOldestInMemory(): void {
    const purgeCount = Math.max(1, Math.floor(this.capacity * 0.1));
    this.inMemoryFallback.splice(0, purgeCount);
  }

  /**
   * Performs FIFO Eviction on IndexedDB records if count exceeds capacity.
   */
  public async evictOldest(count?: number): Promise<number> {
    const purgeCount = count ?? Math.max(1, Math.floor(this.capacity * 0.1));
    this.evictOldestInMemory();

    const db = await this.getDB();
    if (!db) return purgeCount;

    return new Promise((resolve) => {
      try {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.openCursor();
        let deleted = 0;

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor && deleted < purgeCount) {
            cursor.delete();
            deleted++;
            cursor.continue();
          } else {
            resolve(deleted);
          }
        };

        request.onerror = () => resolve(0);
      } catch {
        resolve(0);
      }
    });
  }

  /**
   * Queries stored log entries.
   */
  public async getEntries(): Promise<AgenticLogEntry[]> {
    const db = await this.getDB();
    if (!db) return [...this.inMemoryFallback];

    return new Promise((resolve) => {
      try {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          const results = request.result as AgenticLogEntry[];
          resolve(results.length > 0 ? results : [...this.inMemoryFallback]);
        };

        request.onerror = () => resolve([...this.inMemoryFallback]);
      } catch {
        resolve([...this.inMemoryFallback]);
      }
    });
  }

  /**
   * Synchronous accessor for in-memory entries.
   */
  public getInMemoryEntries(): AgenticLogEntry[] {
    return [...this.inMemoryFallback];
  }

  /**
   * Exports all logs as formatted JSON.
   */
  public async exportLogs(): Promise<string> {
    const entries = await this.getEntries();
    return JSON.stringify(entries, null, 2);
  }

  /**
   * Clears all log entries from memory and IndexedDB.
   */
  public async clear(): Promise<void> {
    this.inMemoryFallback = [];
    const db = await this.getDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public getLength(): number {
    return this.inMemoryFallback.length;
  }
}
