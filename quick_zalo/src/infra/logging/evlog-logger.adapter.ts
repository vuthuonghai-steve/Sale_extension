/**
 * @file evlog-logger.adapter.ts
 * @layer Infrastructure Layer (@infra/logging)
 * @description Thin adapter exposing EvlogLogger (singleton) behind the ILogger
 * port so @app can depend on the port instead of concrete infra. Pure delegation.
 */

import type { ILogger } from '@app/ports/logger.port';
import { EvlogLogger } from './evlog-logger';

export class EvlogLoggerAdapter implements ILogger {
  private readonly logger: EvlogLogger;

  constructor() {
    this.logger = EvlogLogger.getInstance();
  }

  log<TPayload extends Record<string, unknown>>(
    scope: string,
    level: Parameters<EvlogLogger['log']>[1],
    decisionReason: string,
    payload?: TPayload,
    error?: unknown
  ): void {
    this.logger.log(scope, level, decisionReason, payload, error);
  }

  debug<T extends Record<string, unknown>>(scope: string, reason: string, payload?: T): void {
    this.logger.debug(scope, reason, payload);
  }

  info<T extends Record<string, unknown>>(scope: string, reason: string, payload?: T): void {
    this.logger.info(scope, reason, payload);
  }

  warn<T extends Record<string, unknown>>(scope: string, reason: string, payload?: T): void {
    this.logger.warn(scope, reason, payload);
  }

  error<T extends Record<string, unknown>>(
    scope: string,
    reason: string,
    payload?: T,
    err?: unknown
  ): void {
    this.logger.error(scope, reason, payload, err);
  }

  fatal<T extends Record<string, unknown>>(
    scope: string,
    reason: string,
    payload?: T,
    err?: unknown
  ): void {
    this.logger.fatal(scope, reason, payload, err);
  }
}
