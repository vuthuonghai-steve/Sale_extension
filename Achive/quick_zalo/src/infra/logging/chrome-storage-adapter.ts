import type { AgenticLogEntry } from '../../shared/types/evlog.types';

export interface StorageAdapterOptions {
  capacity?: number;
  storageKey?: string;
  autoFlushIntervalMs?: number;
}

export class ChromeStorageAdapter {
  private inMemoryRingBuffer: AgenticLogEntry[] = [];
  private readonly capacity: number;
  private readonly storageKey: string;
  private isStorageAvailable: boolean = true;
  private isFlushPending: boolean = false;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options?: StorageAdapterOptions) {
    this.capacity = options?.capacity ?? 5000;
    this.storageKey = options?.storageKey ?? 'evlog_ring_buffer';

    // Test chrome.storage.local availability
    this.checkStorageAvailability();
  }

  private checkStorageAvailability(): void {
    try {
      this.isStorageAvailable =
        typeof chrome !== 'undefined' &&
        !!chrome.storage &&
        !!chrome.storage.local;
    } catch {
      this.isStorageAvailable = false;
    }
  }

  /**
   * Appends a log entry to the in-memory FIFO Ring Buffer.
   * If capacity is reached, automatically purges the oldest 10% (FIFO).
   */
  public push(entry: AgenticLogEntry): void {
    if (this.inMemoryRingBuffer.length >= this.capacity) {
      this.evictOldest();
    }
    this.inMemoryRingBuffer.push(entry);
    this.scheduleFlush();
  }

  /**
   * FIFO Eviction: Removes oldest 10% of entries.
   */
  private evictOldest(): void {
    const purgeCount = Math.max(1, Math.floor(this.capacity * 0.1));
    this.inMemoryRingBuffer.splice(0, purgeCount);
  }

  /**
   * Schedules a debounced flush to chrome.storage.local to avoid main loop blocking.
   */
  private scheduleFlush(): void {
    if (!this.isStorageAvailable) return;
    if (this.isFlushPending) return;

    this.isFlushPending = true;
    if (this.flushTimer) clearTimeout(this.flushTimer);

    this.flushTimer = setTimeout(() => {
      this.flushToStorage().catch((err) => {
        console.warn('[ChromeStorageAdapter] Failed to flush logs to chrome.storage.local:', err);
      });
    }, 200);
  }

  /**
   * Directly flushes in-memory entries to chrome.storage.local.
   */
  public async flushToStorage(): Promise<void> {
    this.isFlushPending = false;
    if (!this.isStorageAvailable) return;

    try {
      await chrome.storage.local.set({
        [this.storageKey]: this.inMemoryRingBuffer,
      });
    } catch (error) {
      // Storage quota exceeded or context invalidated fallback
      this.isStorageAvailable = false;
      console.warn(
        '[ChromeStorageAdapter] Falling back to In-Memory Ring Buffer only due to storage error:',
        error
      );
    }
  }

  /**
   * Loads persisted logs from chrome.storage.local into in-memory ring buffer.
   */
  public async loadFromStorage(): Promise<void> {
    if (!this.isStorageAvailable) return;

    try {
      const data = await chrome.storage.local.get(this.storageKey);
      if (data && Array.isArray(data[this.storageKey])) {
        this.inMemoryRingBuffer = data[this.storageKey] as AgenticLogEntry[];
      }
    } catch (error) {
      console.warn('[ChromeStorageAdapter] Unable to load persisted logs:', error);
    }
  }

  /**
   * Returns current ring buffer entries.
   */
  public getEntries(): AgenticLogEntry[] {
    return [...this.inMemoryRingBuffer];
  }

  /**
   * Exports all log entries as a formatted JSON string.
   */
  public exportLogs(): string {
    return JSON.stringify(this.inMemoryRingBuffer, null, 2);
  }

  /**
   * Clears in-memory buffer and persisted storage.
   */
  public async clear(): Promise<void> {
    this.inMemoryRingBuffer = [];
    if (this.isStorageAvailable) {
      try {
        await chrome.storage.local.remove(this.storageKey);
      } catch (error) {
        console.warn('[ChromeStorageAdapter] Failed to clear storage:', error);
      }
    }
  }

  public getLength(): number {
    return this.inMemoryRingBuffer.length;
  }
}
