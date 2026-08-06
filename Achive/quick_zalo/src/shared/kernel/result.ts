import type { AppError } from '../contracts/errors';

export type Result<T, E = AppError> = Ok<T, E> | Err<T, E>;

export class Ok<T, E = AppError> {
  readonly isOk = true as const;
  readonly isErr = false as const;
  // Backward compatibility property
  readonly ok = true as const;

  constructor(readonly value: T) {}

  unwrap(): T {
    return this.value;
  }

  unwrapOr(_fallback: T): T {
    return this.value;
  }

  map<U>(fn: (val: T) => U): Result<U, E> {
    return new Ok<U, E>(fn(this.value));
  }

  mapErr<F>(_fn: (err: E) => F): Result<T, F> {
    return new Ok<T, F>(this.value);
  }
}

export class Err<T, E = AppError> {
  readonly isOk = false as const;
  readonly isErr = true as const;
  // Backward compatibility property
  readonly ok = false as const;

  constructor(readonly error: E) {}

  unwrap(): T {
    const errorMsg =
      typeof this.error === 'object' && this.error !== null
        ? JSON.stringify(this.error)
        : String(this.error);
    throw new Error(`Called unwrap on an Err value: ${errorMsg}`);
  }

  unwrapOr(fallback: T): T {
    return fallback;
  }

  map<U>(_fn: (val: T) => U): Result<U, E> {
    return new Err<U, E>(this.error);
  }

  mapErr<F>(fn: (err: E) => F): Result<T, F> {
    return new Err<T, F>(fn(this.error));
  }
}

export const ok = <T, E = AppError>(value: T): Result<T, E> => new Ok<T, E>(value);
export const err = <E, T = unknown>(error: E): Result<T, E> => new Err<T, E>(error);
