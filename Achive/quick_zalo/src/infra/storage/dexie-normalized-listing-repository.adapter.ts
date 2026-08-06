import {
  INormalizedListingRepository,
  ListingQueryOptions,
  SaveListingBatchResult,
  ListingIngestionMetrics,
} from '@app/ports/normalized-listing-repository.port';
import { NormalizedListing } from '@domain/data-normalization/entities/normalized-listing.entity';
import { Result, ok, err } from '@shared/kernel/result';
import { AppError } from '@shared/contracts/errors';
import { QuickZaloDexieDB, dexieDb } from './dexie-database';

export class DexieNormalizedListingRepository implements INormalizedListingRepository {
  constructor(private readonly db: QuickZaloDexieDB = dexieDb) {}

  public async save(listing: NormalizedListing): Promise<Result<NormalizedListing, AppError>> {
    try {
      await this.db.normalized_listings.put(listing);
      return ok(listing);
    } catch (e) {
      return err({ code: 'INFRA', message: `Failed to save listing to IndexedDB: ${String(e)}` });
    }
  }

  public async saveBatch(
    listings: NormalizedListing[],
    dupesInFileCount: number
  ): Promise<Result<SaveListingBatchResult, AppError>> {
    try {
      const hashes = listings.map((l) => l.contentHash);
      const existingHashesResult = await this.findExistingHashes(hashes);

      if (existingHashesResult.isErr) {
        return err(existingHashesResult.error);
      }

      const existingHashes = existingHashesResult.value;
      const newListings: NormalizedListing[] = [];
      let dupesInDbCount = 0;
      let partialParsedCount = 0;

      for (const listing of listings) {
        if (existingHashes.has(listing.contentHash)) {
          dupesInDbCount++;
        } else {
          newListings.push(listing);
          if (listing.isPartiallyParsed) {
            partialParsedCount++;
          }
        }
      }

      if (newListings.length > 0) {
        await this.db.normalized_listings.bulkPut(newListings);
      }

      const metrics: ListingIngestionMetrics = {
        totalInput: listings.length + dupesInFileCount,
        dupesInFile: dupesInFileCount,
        dupesInDb: dupesInDbCount,
        newlyInserted: newListings.length,
        partialParsedCount,
      };

      return ok({
        metrics,
        savedListings: newListings,
      });
    } catch (e) {
      return err({ code: 'INFRA', message: `Failed to batch save listings: ${String(e)}` });
    }
  }

  public async findExistingHashes(hashes: string[]): Promise<Result<Set<string>, AppError>> {
    try {
      if (hashes.length === 0) {
        return ok(new Set<string>());
      }
      const existingRecords = await this.db.normalized_listings
        .where('contentHash')
        .anyOf(hashes)
        .toArray();

      const existingSet = new Set(existingRecords.map((r) => r.contentHash));
      return ok(existingSet);
    } catch (e) {
      return err({ code: 'INFRA', message: `Failed to query existing content hashes: ${String(e)}` });
    }
  }

  public async findAll(options?: ListingQueryOptions): Promise<Result<NormalizedListing[], AppError>> {
    try {
      const collection = this.db.normalized_listings.toCollection();
      let records = await collection.reverse().toArray();

      if (options?.searchQuery) {
        const query = options.searchQuery.toLowerCase().trim();
        records = records.filter(
          (r) =>
            r.data_raw.toLowerCase().includes(query) ||
            (r.code && r.code.toLowerCase().includes(query)) ||
            (r.address && r.address.toLowerCase().includes(query)) ||
            (r.district && r.district.toLowerCase().includes(query))
        );
      }

      if (options?.district) {
        records = records.filter((r) => r.district?.toLowerCase() === options.district?.toLowerCase());
      }

      if (options?.templateFamily !== undefined) {
        records = records.filter((r) => r.templateFamily === options.templateFamily);
      }

      if (options?.isPartiallyParsed !== undefined) {
        records = records.filter((r) => r.isPartiallyParsed === options.isPartiallyParsed);
      }

      if (options?.hasElevator !== undefined) {
        records = records.filter((r) => r.hasElevator === options.hasElevator);
      }

      if (options?.minPrice !== undefined) {
        records = records.filter((r) => r.priceNumeric !== null && r.priceNumeric >= options.minPrice!);
      }

      if (options?.maxPrice !== undefined) {
        records = records.filter((r) => r.priceNumeric !== null && r.priceNumeric <= options.maxPrice!);
      }

      if (options?.limit) {
        const offset = options.offset || 0;
        records = records.slice(offset, offset + options.limit);
      }

      return ok(records);
    } catch (e) {
      return err({ code: 'INFRA', message: `Failed to fetch listings from IndexedDB: ${String(e)}` });
    }
  }

  public async clearAll(): Promise<Result<void, AppError>> {
    try {
      await this.db.normalized_listings.clear();
      return ok(undefined);
    } catch (e) {
      return err({ code: 'INFRA', message: `Failed to clear IndexedDB listings: ${String(e)}` });
    }
  }

  public async count(): Promise<Result<number, AppError>> {
    try {
      const count = await this.db.normalized_listings.count();
      return ok(count);
    } catch (e) {
      return err({ code: 'INFRA', message: `Failed to count IndexedDB listings: ${String(e)}` });
    }
  }
}
