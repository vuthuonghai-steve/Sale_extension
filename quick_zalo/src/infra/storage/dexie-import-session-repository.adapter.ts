import { IImportSessionRepository } from '../../app/ports/import-session-repository.port';
import { ImportSession } from '../../domain/data-normalization/entities/import-session.entity';
import { Result, ok, err } from '../../shared/kernel/result';
import { AppError } from '../../shared/contracts/errors';
import { QuickZaloDexieDB, dexieDb } from './dexie-database';

export class DexieImportSessionRepository implements IImportSessionRepository {
  constructor(private readonly db: QuickZaloDexieDB = dexieDb) {}

  public async save(session: ImportSession): Promise<Result<ImportSession, AppError>> {
    try {
      await this.db.import_sessions.put(session);
      return ok(session);
    } catch (e) {
      return err({ code: 'INFRA', message: `Failed to save import session: ${String(e)}` });
    }
  }

  public async getLatest(): Promise<Result<ImportSession | null, AppError>> {
    try {
      const latest = await this.db.import_sessions.orderBy('importedAt').reverse().first();
      return ok(latest || null);
    } catch (e) {
      return err({ code: 'INFRA', message: `Failed to get latest import session: ${String(e)}` });
    }
  }

  public async findById(id: string): Promise<Result<ImportSession | null, AppError>> {
    try {
      const session = await this.db.import_sessions.get(id);
      return ok(session || null);
    } catch (e) {
      return err({ code: 'INFRA', message: `Failed to find import session by ID: ${String(e)}` });
    }
  }

  public async clearAll(): Promise<Result<void, AppError>> {
    try {
      await this.db.import_sessions.clear();
      return ok(undefined);
    } catch (e) {
      return err({ code: 'INFRA', message: `Failed to clear import sessions: ${String(e)}` });
    }
  }
}
