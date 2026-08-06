/**
 * @file logger.port.ts
 * @layer Application Layer (@app/ports)
 * @description Port (interface) abstracting the logging capability so @app never
 * depends on concrete @infra implementations. Structural match of EvlogLogger's
 * logging surface (src/infra/logging/evlog-logger.ts) — drop-in compatible.
 */

import type { LogLevel } from '@shared/types/evlog.types';

export interface ILogger {
  /**
   * Low-level log entry with explicit level. Mirrors EvlogLogger.log.
   */
  log<TPayload extends Record<string, unknown>>(
    scope: string,
    level: LogLevel,
    decisionReason: string,
    payload?: TPayload,
    error?: unknown
  ): void;

  debug<T extends Record<string, unknown>>(scope: string, reason: string, payload?: T): void;
  info<T extends Record<string, unknown>>(scope: string, reason: string, payload?: T): void;
  warn<T extends Record<string, unknown>>(scope: string, reason: string, payload?: T): void;
  error<T extends Record<string, unknown>>(
    scope: string,
    reason: string,
    payload?: T,
    err?: unknown
  ): void;
  fatal<T extends Record<string, unknown>>(
    scope: string,
    reason: string,
    payload?: T,
    err?: unknown
  ): void;
}
