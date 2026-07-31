export class StorageError extends Error {
  readonly code = 'STORAGE_ERROR';

  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

export type AppError =
  | { code: 'VALIDATION'; message: string }
  | { code: 'NOT_FOUND'; message: string }
  | { code: 'PERMISSION'; message: string }
  | { code: 'INFRA'; message: string; cause?: unknown }
  | StorageError;
