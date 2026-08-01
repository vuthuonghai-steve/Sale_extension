import { ImportSession } from '@domain/data-normalization/entities/import-session.entity';
import { Result } from '@shared/kernel/result';
import { AppError } from '@shared/contracts/errors';

export interface IImportSessionRepository {
  /**
   * Save or update an import session
   */
  save(session: ImportSession): Promise<Result<ImportSession, AppError>>;

  /**
   * Get the latest import session (backup for current working day)
   */
  getLatest(): Promise<Result<ImportSession | null, AppError>>;

  /**
   * Find an import session by ID
   */
  findById(id: string): Promise<Result<ImportSession | null, AppError>>;

  /**
   * Delete all import sessions (for reset / testing)
   */
  clearAll(): Promise<Result<void, AppError>>;
}
