import { NormalizedMessage, IngestionMetrics } from '@domain/data-normalization/entities/normalized-message.entity';
import { Result } from '@shared/kernel/result';
import { AppError, StorageError } from '@shared/contracts/errors';
import type { BufferedMessageEntity } from '@domain/quick-search/entities/buffered-message.entity';

export interface QueryOptions {
  searchQuery?: string;
  district?: string;
  hasElevator?: boolean;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}

export interface SaveBatchResult {
  metrics: IngestionMetrics;
  savedMessages: NormalizedMessage[];
}

export interface IMessageRepository {
  /**
   * Save a single normalized message record
   */
  save(message: NormalizedMessage): Promise<Result<NormalizedMessage, AppError>>;

  /**
   * Batch save normalized messages with Stage 2 DB deduplication
   */
  saveBatch(messages: NormalizedMessage[], dupesInFileCount: number): Promise<Result<SaveBatchResult, AppError>>;

  /**
   * Find existing content hashes in the database
   */
  findExistingHashes(hashes: string[]): Promise<Result<Set<string>, AppError>>;

  /**
   * Query all stored messages with filtering options
   */
  findAll(options?: QueryOptions): Promise<Result<NormalizedMessage[], AppError>>;

  /**
   * Delete all stored messages (for reset / testing)
   */
  clearAll(): Promise<Result<void, AppError>>;

  /**
   * Get total count of stored messages
   */
  count(): Promise<Result<number, AppError>>;
}

export interface IDexieMessageRepository {
  findByHash(hash: string): Promise<Result<BufferedMessageEntity | null, StorageError>>;
  findByRawData(
    rawContent: string,
    hash: string
  ): Promise<Result<{ found: boolean; matchType?: 'RAW_DATA'; details?: string }, StorageError>>;
}

