/**
 * @file message-repository.port.ts
 * @layer Application Layer (@app/features/quick-search/ports)
 * @description Port interface for Dexie Message Repository lookup in Quick Search feature.
 */

import type { Result } from '@shared/kernel/result';
import type { StorageError } from '@shared/contracts/errors';
import type { BufferedMessageEntity } from '@domain/quick-search/entities/buffered-message.entity';

export interface IDexieMessageRepository {
  findByHash(hash: string): Promise<Result<BufferedMessageEntity | null, StorageError>>;
  findByAddressAndPrice(
    address: string | null,
    priceNumeric: number | null,
    priceText: string | null
  ): Promise<Result<{ found: boolean; matchType?: 'ADDRESS_PRICE'; details?: string }, StorageError>>;
  findByRawData(
    rawContent: string,
    hash: string
  ): Promise<Result<{ found: boolean; matchType?: 'RAW_DATA'; details?: string }, StorageError>>;
}
