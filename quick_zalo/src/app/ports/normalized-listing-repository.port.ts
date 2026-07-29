import { NormalizedListing } from '../../domain/data-normalization/entities/normalized-listing.entity';
import { Result } from '../../shared/kernel/result';
import { AppError } from '../../shared/contracts/errors';

export interface ListingQueryOptions {
  searchQuery?: string;
  district?: string;
  templateFamily?: 'TNR' | 'Sky' | '95_Home' | null;
  isPartiallyParsed?: boolean;
  hasElevator?: boolean;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}

export interface ListingIngestionMetrics {
  totalInput: number;
  dupesInFile: number;
  dupesInDb: number;
  newlyInserted: number;
  partialParsedCount: number;
}

export interface SaveListingBatchResult {
  metrics: ListingIngestionMetrics;
  savedListings: NormalizedListing[];
}

export interface INormalizedListingRepository {
  /**
   * Save a single normalized listing record
   */
  save(listing: NormalizedListing): Promise<Result<NormalizedListing, AppError>>;

  /**
   * Batch save normalized listings with Stage 2 DB deduplication
   */
  saveBatch(listings: NormalizedListing[], dupesInFileCount: number): Promise<Result<SaveListingBatchResult, AppError>>;

  /**
   * Find existing content hashes in the database
   */
  findExistingHashes(hashes: string[]): Promise<Result<Set<string>, AppError>>;

  /**
   * Query all stored listings with filtering options
   */
  findAll(options?: ListingQueryOptions): Promise<Result<NormalizedListing[], AppError>>;

  /**
   * Delete all stored listings (for reset / testing)
   */
  clearAll(): Promise<Result<void, AppError>>;

  /**
   * Get total count of stored listings
   */
  count(): Promise<Result<number, AppError>>;
}
