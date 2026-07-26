import { describe, it, expect, beforeEach } from 'vitest';
import { LoggingCircuitBreaker } from './circuit-breaker';

describe('LoggingCircuitBreaker', () => {
  let cb: LoggingCircuitBreaker;

  beforeEach(() => {
    cb = new LoggingCircuitBreaker(30);
  });

  it('should allow up to 30 calls in 1 second window', () => {
    const now = 10000;
    for (let i = 0; i < 30; i++) {
      expect(cb.allowCall(now)).toBe(true);
    }
    expect(cb.getMetrics().state).toBe('CLOSED');
  });

  it('should trip to OPEN state on the 31st call in 1 second window', () => {
    const now = 10000;
    for (let i = 0; i < 30; i++) {
      cb.allowCall(now);
    }

    // 31st call should trip breaker
    const allowed = cb.allowCall(now);
    expect(allowed).toBe(false);
    expect(cb.getMetrics().state).toBe('OPEN');
    expect(cb.getMetrics().trippedCount).toBe(1);
  });

  it('should reset back to CLOSED after 1 second window clears', () => {
    const start = 10000;
    for (let i = 0; i < 31; i++) {
      cb.allowCall(start);
    }
    expect(cb.getMetrics().state).toBe('OPEN');

    // Advance 1001ms
    const later = start + 1001;
    const allowed = cb.allowCall(later);
    expect(allowed).toBe(true);
    expect(cb.getMetrics().state).toBe('CLOSED');
  });
});
