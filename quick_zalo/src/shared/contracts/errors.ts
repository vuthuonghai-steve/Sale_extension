export type AppError =
  | { code: 'VALIDATION'; message: string }
  | { code: 'NOT_FOUND'; message: string }
  | { code: 'PERMISSION'; message: string }
  | { code: 'INFRA'; message: string; cause?: unknown };
