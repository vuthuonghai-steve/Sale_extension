import type { AgenticLogEntry } from '../../shared/types/evlog.types';
import { formatConsoleStyle } from './formatters';
import type { IndexedDBAdapter } from './indexeddb-adapter';
import type { ChromeStorageAdapter } from './chrome-storage-adapter';

export interface StorageTransportAdapter {
  push(entry: AgenticLogEntry): void | Promise<void>;
}

export interface DualDispatcherOptions {
  enableConsole?: boolean;
  enableStorage?: boolean;
  storageAdapter?: StorageTransportAdapter | IndexedDBAdapter | ChromeStorageAdapter;
}

export class DualTransportDispatcher {
  private enableConsole: boolean;
  private enableStorage: boolean;
  private storageAdapter: StorageTransportAdapter | null = null;

  constructor(options?: DualDispatcherOptions) {
    this.enableConsole = options?.enableConsole ?? true;
    this.enableStorage = options?.enableStorage ?? true;
    this.storageAdapter = (options?.storageAdapter as StorageTransportAdapter) ?? null;
  }

  public setStorageAdapter(adapter: StorageTransportAdapter): void {
    this.storageAdapter = adapter;
  }

  public setEnableConsole(enabled: boolean): void {
    this.enableConsole = enabled;
  }

  public setEnableStorage(enabled: boolean): void {
    this.enableStorage = enabled;
  }

  /**
   * Dispatches log entry in parallel non-blocking transports.
   */
  public dispatch(entry: AgenticLogEntry): void {
    // 1. Console Transport (Immediate synchronous formatting for developer DevTools inspection)
    if (this.enableConsole) {
      this.emitToConsole(entry);
    }

    // 2. Storage Transport (Immediate ring buffer update, disk I/O debounced)
    if (this.enableStorage && this.storageAdapter) {
      try {
        const res = this.storageAdapter.push(entry);
        if (res && typeof (res as Promise<void>).catch === 'function') {
          (res as Promise<void>).catch((err) => {
            console.warn('[DualTransportDispatcher] Storage async write error:', err);
          });
        }
      } catch (err) {
        console.warn('[DualTransportDispatcher] Failed to write storage log:', err);
      }
    }
  }

  private emitToConsole(entry: AgenticLogEntry): void {
    const { messageString, styles } = formatConsoleStyle(entry);
    switch (entry.level) {
      case 'DEBUG':
        console.debug(messageString, ...styles, entry.payload);
        break;
      case 'INFO':
        console.info(messageString, ...styles, entry.payload);
        break;
      case 'WARN':
        console.warn(messageString, ...styles, entry.payload);
        break;
      case 'ERROR':
      case 'FATAL':
        console.error(messageString, ...styles, entry.payload, entry.stack_trace ?? '');
        break;
    }
  }
}
