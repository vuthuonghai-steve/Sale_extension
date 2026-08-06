export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface AgenticLogEntry<TPayload = Record<string, unknown>> {
  /** Unique correlation ID for tracking request/event lifecycle across entrypoints (UUIDv4) */
  trace_id: string;

  /** Module boundary scope identifier (e.g. '@domain/crm', '@infra/logging', '@entrypoints/background') */
  scope: string;

  /** Log severity level */
  level: LogLevel;

  /** Source code location coordinates in format 'relative/path/to/file.ts:line_number' */
  file_line: string;

  /** LLM-readable decision rationale explaining WHY this event or branch occurred */
  decision_reason: string;

  /** Structured payload object containing contextual variables and metadata */
  payload: TPayload;

  /** ISO-8601 UTC timestamp string (e.g. '2026-07-27T05:30:00.000Z') */
  timestamp: string;

  /** Optional stack trace string attached during ERROR or FATAL events */
  stack_trace?: string;
}

export interface LoggerConfig {
  minLevel: LogLevel;
  maxCallsPerSec: number;
  bufferCapacity: number;
  storageKey: string;
  enableConsole: boolean;
  enableStorage: boolean;
}

export type CircuitState = 'CLOSED' | 'OPEN';

export interface CircuitBreakerMetrics {
  state: CircuitState;
  currentRate: number;
  trippedCount: number;
  lastTrippedAt: string | null;
}
