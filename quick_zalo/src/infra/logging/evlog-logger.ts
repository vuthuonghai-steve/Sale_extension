import type {
  AgenticLogEntry,
  LogLevel,
  LoggerConfig,
} from '../../shared/types/evlog.types';
import { LoggingCircuitBreaker } from './circuit-breaker';
import { ChromeStorageAdapter } from './chrome-storage-adapter';
import { IndexedDBAdapter } from './indexeddb-adapter';
import { DualTransportDispatcher } from './dual-dispatcher';
import { sanitizePII, getFileLineCoordinate } from './formatters';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
  FATAL: 50,
};

export class EvlogLogger {
  private static instance: EvlogLogger | null = null;
  private config: LoggerConfig;
  private circuitBreaker: LoggingCircuitBreaker;
  private chromeStorageAdapter: ChromeStorageAdapter;
  private indexedDBAdapter: IndexedDBAdapter;
  private dispatcher: DualTransportDispatcher;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      minLevel: config?.minLevel ?? 'INFO',
      maxCallsPerSec: config?.maxCallsPerSec ?? 30,
      bufferCapacity: config?.bufferCapacity ?? 5000,
      storageKey: config?.storageKey ?? 'evlog_ring_buffer',
      enableConsole: config?.enableConsole ?? true,
      enableStorage: config?.enableStorage ?? true,
    };

    this.circuitBreaker = new LoggingCircuitBreaker(this.config.maxCallsPerSec);
    this.chromeStorageAdapter = new ChromeStorageAdapter({
      capacity: this.config.bufferCapacity,
      storageKey: this.config.storageKey,
    });
    this.indexedDBAdapter = new IndexedDBAdapter({
      capacity: this.config.bufferCapacity,
    });

    this.dispatcher = new DualTransportDispatcher({
      enableConsole: this.config.enableConsole,
      enableStorage: this.config.enableStorage,
      storageAdapter: this.chromeStorageAdapter,
    });
  }

  public static getInstance(config?: Partial<LoggerConfig>): EvlogLogger {
    if (!EvlogLogger.instance) {
      EvlogLogger.instance = new EvlogLogger(config);
    }
    return EvlogLogger.instance;
  }

  public setLogLevel(level: LogLevel): void {
    this.config.minLevel = level;
  }

  public getLogLevel(): LogLevel {
    return this.config.minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.minLevel];
  }

  private generateTraceId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  public log<TPayload extends Record<string, unknown> = Record<string, unknown>>(
    scope: string,
    level: LogLevel,
    decision_reason: string,
    payload?: TPayload,
    error?: unknown
  ): AgenticLogEntry<TPayload> | null {
    if (!this.shouldLog(level)) {
      return null;
    }

    // Circuit Breaker Rate Check (> 30 calls/sec limit)
    if (!this.circuitBreaker.allowCall()) {
      return null;
    }

    const timestamp = new Date().toISOString();
    const trace_id = this.generateTraceId();
    const stack_trace =
      error instanceof Error
        ? error.stack
        : level === 'ERROR' || level === 'FATAL'
        ? new Error().stack
        : undefined;

    const file_line = getFileLineCoordinate(stack_trace);
    const sanitizedPayload = (sanitizePII(payload ?? {}) as TPayload) || ({} as TPayload);

    const entry: AgenticLogEntry<TPayload> = {
      trace_id,
      scope,
      level,
      file_line,
      decision_reason,
      payload: sanitizedPayload,
      timestamp,
      ...(stack_trace ? { stack_trace } : {}),
    };

    // Parallel Dual Transport Emission via Dispatcher
    this.dispatcher.dispatch(entry as unknown as AgenticLogEntry);

    // Also persist entry into IndexedDB Adapter
    if (this.config.enableStorage) {
      this.indexedDBAdapter.push(entry as unknown as AgenticLogEntry).catch(() => {});
    }

    return entry;
  }

  public debug<T extends Record<string, unknown> = Record<string, unknown>>(
    scope: string,
    reason: string,
    payload?: T
  ) {
    return this.log(scope, 'DEBUG', reason, payload);
  }

  public info<T extends Record<string, unknown> = Record<string, unknown>>(
    scope: string,
    reason: string,
    payload?: T
  ) {
    return this.log(scope, 'INFO', reason, payload);
  }

  public warn<T extends Record<string, unknown> = Record<string, unknown>>(
    scope: string,
    reason: string,
    payload?: T
  ) {
    return this.log(scope, 'WARN', reason, payload);
  }

  public error<T extends Record<string, unknown> = Record<string, unknown>>(
    scope: string,
    reason: string,
    payload?: T,
    err?: unknown
  ) {
    return this.log(scope, 'ERROR', reason, payload, err);
  }

  public fatal<T extends Record<string, unknown> = Record<string, unknown>>(
    scope: string,
    reason: string,
    payload?: T,
    err?: unknown
  ) {
    return this.log(scope, 'FATAL', reason, payload, err);
  }

  public getCircuitBreakerMetrics() {
    return this.circuitBreaker.getMetrics();
  }

  public getStorageAdapter(): ChromeStorageAdapter {
    return this.chromeStorageAdapter;
  }

  public getIndexedDBAdapter(): IndexedDBAdapter {
    return this.indexedDBAdapter;
  }

  public exportLogs(): string {
    const entries = this.chromeStorageAdapter.getEntries();
    if (entries.length > 0) {
      return JSON.stringify(entries, null, 2);
    }
    return JSON.stringify(this.indexedDBAdapter.getInMemoryEntries(), null, 2);
  }

  public async clearLogs(): Promise<void> {
    await this.chromeStorageAdapter.clear();
    await this.indexedDBAdapter.clear();
  }
}

// Global Facade Instance Export
export const Evlog = EvlogLogger.getInstance();
