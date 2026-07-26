import { Result, ok, err } from './result';
import type { AppError } from '../contracts/errors';

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Timeout in milliseconds per attempt (default: 5000ms) */
  timeoutMs?: number;
  /** Initial backoff delay in milliseconds (default: 300ms) */
  backoffMs?: number;
  /** Whether to use exponential backoff (default: true) */
  exponential?: boolean;
  /** Optional predicate to decide if an error is retryable */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Optional callback triggered on each retry attempt */
  onRetry?: (attempt: number, error: unknown, nextDelayMs: number) => void;
}

/**
 * Standardized async execution helper with bounded Max Retries & Timeout.
 * Returns a Result<T, AppError> and guarantees zero unhandled exceptions.
 */
export async function withRetryAndTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options?: RetryOptions
): Promise<Result<T, AppError>> {
  const maxRetries = options?.maxRetries ?? 3;
  const timeoutMs = options?.timeoutMs ?? 5000;
  const initialBackoff = options?.backoffMs ?? 300;
  const exponential = options?.exponential ?? true;

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([
        operation(controller.signal),
        timeoutPromise,
      ]);
      if (timeoutId) clearTimeout(timeoutId);
      return ok(result);
    } catch (caughtError) {
      if (timeoutId) clearTimeout(timeoutId);
      lastError = caughtError;

      const isLastAttempt = attempt > maxRetries;
      const canRetry = options?.shouldRetry
        ? options.shouldRetry(caughtError, attempt)
        : true;

      if (isLastAttempt || !canRetry) {
        break;
      }

      const backoffDelay = exponential
        ? initialBackoff * Math.pow(2, attempt - 1)
        : initialBackoff;

      if (options?.onRetry) {
        options.onRetry(attempt, caughtError, backoffDelay);
      }

      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }

  const errorMessage =
    lastError instanceof Error
      ? lastError.message
      : String(lastError ?? 'Operation failed');

  return err({
    code: 'INFRA',
    message: `Async operation failed after max retries (${maxRetries}): ${errorMessage}`,
    cause: lastError,
  });
}
