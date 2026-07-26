import { describe, it, expect } from 'vitest';
import { ok, err, Ok, Err } from './result';

describe('Result Kernel', () => {
  it('should create Ok result correctly', () => {
    const res = ok(42);
    expect(res.isOk).toBe(true);
    expect(res.isErr).toBe(false);
    expect(res.unwrap()).toBe(42);
    expect(res.unwrapOr(0)).toBe(42);
  });

  it('should create Err result correctly', () => {
    const res = err<{ code: string; message: string }, number>({
      code: 'VALIDATION',
      message: 'Invalid field',
    });
    expect(res.isOk).toBe(false);
    expect(res.isErr).toBe(true);
    expect(res.unwrapOr(100)).toBe(100);
    expect(() => res.unwrap()).toThrow('Called unwrap on an Err value');
  });

  it('should support map on Ok', () => {
    const res = ok(10).map((n) => n * 2);
    expect(res.unwrap()).toBe(20);
  });

  it('should bypass map on Err', () => {
    const res = err<string, number>('FAILED').map((n: number) => n * 2);
    expect(res.isErr).toBe(true);
  });

  it('should support mapErr on Err', () => {
    const res = err('bad').mapErr((msg) => msg.toUpperCase());
    if (res.isErr) {
      expect(res.error).toBe('BAD');
    }
  });
});
