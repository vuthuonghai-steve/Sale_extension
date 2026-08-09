import type { LogEntry, LogLevel, LoggerOptions } from '@contracts';

const LOG_SEVERITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export class CentralLogger {
  private buffer: LogEntry[] = [];
  private readonly maxBufferSize: number;
  private minLevel: LogLevel;

  constructor(options: LoggerOptions = {}) {
    this.maxBufferSize = options.maxBufferSize ?? 500;
    this.minLevel = options.minLevel ?? 'info';
  }

  public setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_SEVERITY[level] >= LOG_SEVERITY[this.minLevel];
  }

  private record(
    level: LogLevel,
    scope: string,
    message: string,
    details?: Record<string, unknown>,
    traceId?: string,
  ): LogEntry {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      level,
      scope,
      message,
      traceId,
      details,
    };

    if (this.buffer.length >= this.maxBufferSize) {
      this.buffer.shift();
    }
    this.buffer.push(entry);

    if (this.shouldLog(level)) {
      const formatted = `[${new Date(entry.timestamp).toISOString()}] [${level.toUpperCase()}] [${scope}] ${message}`;
      if (level === 'error') {
        console.error(formatted, details ?? '');
      } else if (level === 'warn') {
        console.warn(formatted, details ?? '');
      } else if (level === 'debug') {
        console.debug(formatted, details ?? '');
      } else {
        console.info(formatted, details ?? '');
      }
    }

    return entry;
  }

  public debug(
    scope: string,
    message: string,
    details?: Record<string, unknown>,
    traceId?: string,
  ): LogEntry {
    return this.record('debug', scope, message, details, traceId);
  }

  public info(
    scope: string,
    message: string,
    details?: Record<string, unknown>,
    traceId?: string,
  ): LogEntry {
    return this.record('info', scope, message, details, traceId);
  }

  public warn(
    scope: string,
    message: string,
    details?: Record<string, unknown>,
    traceId?: string,
  ): LogEntry {
    return this.record('warn', scope, message, details, traceId);
  }

  public error(
    scope: string,
    message: string,
    details?: Record<string, unknown>,
    traceId?: string,
  ): LogEntry {
    return this.record('error', scope, message, details, traceId);
  }

  public getLogs(): readonly LogEntry[] {
    return [...this.buffer];
  }

  public clearLogs(): void {
    this.buffer = [];
  }
}

export const logger = new CentralLogger();
