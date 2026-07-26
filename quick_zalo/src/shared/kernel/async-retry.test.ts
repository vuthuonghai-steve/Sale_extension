import { describe, it, expect, vi } from 'vitest';
import { withRetryAndTimeout } from './async-retry';

describe('withRetryAndTimeout', () => {
  it('should return Ok on first attempt when operation succeeds', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetryAndTimeout(fn, { maxRetries: 3, timeoutMs: 1000 });

    expect(result.isOk).toBe(true);
    expect(result.unwrap()).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry operation up to maxRetries on failure', async () => {
    let attempts = 0;
    const fn = vi.fn().mockImplementation(async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return 'recovered';
    });

    const result = await withRetryAndTimeout(fn, {
      maxRetries: 3,
      timeoutMs: 1000,
      backoffMs: 10,
    });

    expect(result.isOk).toBe(true);
    expect(result.unwrap()).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should return Err(AppError) when maxRetries is exceeded', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Persistent error'));

    const result = await withRetryAndTimeout(fn, {
      maxRetries: 2,
      timeoutMs: 500,
      backoffMs: 10,
    });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.code).toBe('INFRA');
      expect(result.error.message).toContain('max retries (2)');
    }
  });

  it('should trigger timeout error when operation exceeds timeoutMs', async () => {
    const fn = vi.fn().mockImplementation(
      async () => new Promise((resolve) => setTimeout(resolve, 200))
    );

    const result = await withRetryAndTimeout(fn, {
      maxRetries: 1,
      timeoutMs: 50,
      backoffMs: 10,
    });

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error.message).toContain('timed out after 50ms');
    }
  });
});
