export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  readonly id: string;
  readonly timestamp: number;
  readonly level: LogLevel;
  readonly scope: string;
  readonly message: string;
  readonly traceId?: string;
  readonly details?: Record<string, unknown>;
}

export interface LoggerOptions {
  readonly maxBufferSize?: number;
  readonly minLevel?: LogLevel;
}
