import { dexieDb } from './dexie-database';
import type { NormalizedListing, TemplateFamily } from '@domain/data-normalization/entities/normalized-listing.entity';
import { ImportSession } from '@domain/data-normalization/entities/import-session.entity';
import { Result, ok, err } from '@shared/kernel/result';
import { AppError } from '@shared/contracts/errors';
import { INormalizedListingRepository } from '@app/ports/normalized-listing-repository.port';

export interface ListingQueryOptions {
  searchQuery?: string;
  district?: string;
  hasElevator?: boolean;
  templateFamily?: TemplateFamily | 'all' | null;
  isPartiallyParsed?: boolean;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}

export interface IngestionMetricsEx {
  totalInput: number;
  dupesInFile: number;
  dupesInDb: number;
  newlyInserted: number;
  partialParsedCount: number;
  templateBreakdown: {
    TNR: number;
    Sky: number;
    '95_Home': number;
    unknown: number;
  };
}

export class DexieNormalizedListingRepository implements INormalizedListingRepository {
  public async save(listing: NormalizedListing): Promise<Result<NormalizedListing, AppError>> {
    try {
      await dexieDb.normalized_listings.put(listing);
      return ok(listing);
    } catch (e) {
      return err({
        code: 'INFRA',
        message: e instanceof Error ? e.message : 'Lỗi không xác định khi lưu tin nhắn vào IndexedDB',
      });
    }
  }

  public async findExistingHashes(hashes: string[]): Promise<Result<Set<string>, AppError>> {
    try {
      if (hashes.length === 0) return ok(new Set<string>());
      const existingRecords = await dexieDb.normalized_listings
        .where('contentHash')
        .anyOf(hashes)
        .toArray();
      return ok(new Set(existingRecords.map((r) => r.contentHash)));
    } catch (e) {
      return err({
        code: 'INFRA',
        message: e instanceof Error ? e.message : 'Lỗi truy vấn contentHash từ IndexedDB',
      });
    }
  }

  public async count(): Promise<Result<number, AppError>> {
    try {
      const count = await dexieDb.normalized_listings.count();
      return ok(count);
    } catch (e) {
      return err({
        code: 'INFRA',
        message: e instanceof Error ? e.message : 'Lỗi đếm số bản ghi trong IndexedDB',
      });
    }
  }

  public async findAll(options: ListingQueryOptions = {}): Promise<Result<NormalizedListing[], AppError>> {
    try {
      const collection = dexieDb.normalized_listings.toCollection();

      let items = await collection.toArray();

      if (options.templateFamily && options.templateFamily !== 'all') {
        const targetFamily = options.templateFamily === null ? null : options.templateFamily;
        items = items.filter((item) => item.templateFamily === targetFamily);
      }

      if (options.isPartiallyParsed !== undefined) {
        items = items.filter((item) => item.isPartiallyParsed === options.isPartiallyParsed);
      }

      if (options.district) {
        items = items.filter((item) => item.district === options.district);
      }

      if (options.hasElevator !== undefined) {
        items = items.filter((item) => item.hasElevator === options.hasElevator);
      }

      if (options.searchQuery && options.searchQuery.trim()) {
        const rawQuery = options.searchQuery.trim().normalize('NFC').toLowerCase();
        const normQuery = rawQuery.replace(/toà/g, 'tòa').replace(/\s+/g, ' ');

        items = items.filter((item) => {
          const rawContent = (item.data_raw || '').normalize('NFC').toLowerCase();
          const normContent = rawContent.replace(/toà/g, 'tòa').replace(/\s+/g, ' ');

          const code = (item.code || '').normalize('NFC').toLowerCase();
          const address = (item.address || '').normalize('NFC').toLowerCase().replace(/toà/g, 'tòa');

          return (
            code.includes(rawQuery) ||
            address.includes(rawQuery) ||
            address.includes(normQuery) ||
            rawContent.includes(rawQuery) ||
            normContent.includes(normQuery)
          );
        });
      }

      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (options.limit) {
        const offset = options.offset || 0;
        items = items.slice(offset, offset + options.limit);
      }

      return ok(items);
    } catch (e) {
      return err({
        code: 'INFRA',
        message: e instanceof Error ? e.message : 'Lỗi không xác định khi truy vấn IndexedDB',
      });
    }
  }

  public async saveBatch(
    newItems: NormalizedListing[],
    dupesInFile: number,
    sessionMeta: { fileName: string; totalMessages: number } = { fileName: 'import.json', totalMessages: newItems.length }
  ): Promise<Result<any, AppError>> {
    try {
      const hashes = newItems.map((item) => item.contentHash);
      const existingInDb = await dexieDb.normalized_listings
        .where('contentHash')
        .anyOf(hashes)
        .toArray();

      const existingHashSet = new Set(existingInDb.map((item) => item.contentHash));
      const toInsert = newItems.filter((item) => !existingHashSet.has(item.contentHash));
      const dupesInDb = newItems.length - toInsert.length;

      if (toInsert.length > 0) {
        await dexieDb.normalized_listings.bulkPut(toInsert);
      }

      const templateBreakdown = { TNR: 0, Sky: 0, '95_Home': 0, unknown: 0 };
      let partialParsedCount = 0;

      toInsert.forEach((item) => {
        if (item.isPartiallyParsed) partialParsedCount++;
        if (item.templateFamily === 'TNR') templateBreakdown.TNR++;
        else if (item.templateFamily === 'Sky') templateBreakdown.Sky++;
        else if (item.templateFamily === '95_Home') templateBreakdown['95_Home']++;
        else templateBreakdown.unknown++;
      });

      const session: ImportSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        importedAt: new Date().toISOString(),
        sourceFileName: sessionMeta.fileName,
        totalMessages: sessionMeta.totalMessages,
        uniqueListings: newItems.length,
        partialParsedCount,
        templateBreakdown,
        status: 'completed',
      };

      await dexieDb.import_sessions.put(session);

      const metrics: IngestionMetricsEx = {
        totalInput: sessionMeta.totalMessages,
        dupesInFile,
        dupesInDb,
        newlyInserted: toInsert.length,
        partialParsedCount,
        templateBreakdown,
      };

      return ok({ metrics, session, savedListings: toInsert });
    } catch (e) {
      return err({
        code: 'INFRA',
        message: e instanceof Error ? e.message : 'Lỗi lưu batch vào IndexedDB',
      });
    }
  }

  public async getLatestSession(): Promise<Result<ImportSession | null, AppError>> {
    try {
      const sessions = await dexieDb.import_sessions.toArray();
      if (sessions.length === 0) return ok(null);
      sessions.sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime());
      return ok(sessions[0]);
    } catch (e) {
      return err({
        code: 'INFRA',
        message: e instanceof Error ? e.message : 'Lỗi lấy session gần nhất',
      });
    }
  }

  public async clearAll(): Promise<Result<void, AppError>> {
    try {
      await dexieDb.normalized_listings.clear();
      await dexieDb.import_sessions.clear();
      return ok(undefined);
    } catch (e) {
      return err({
        code: 'INFRA',
        message: e instanceof Error ? e.message : 'Lỗi xóa IndexedDB',
      });
    }
  }
}
