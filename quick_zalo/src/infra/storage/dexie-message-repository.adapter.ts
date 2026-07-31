import { IMessageRepository, QueryOptions, SaveBatchResult } from '../../app/ports/message-repository.port';
import { NormalizedMessage, IngestionMetrics } from '../../domain/data-normalization/entities/normalized-message.entity';
import { Result, ok, err } from '../../shared/kernel/result';
import { AppError, StorageError } from '../../shared/contracts/errors';
import { QuickZaloDexieDB, dexieDb } from './dexie-database';

export class DexieMessageRepository implements IMessageRepository {
  constructor(private readonly db: QuickZaloDexieDB = dexieDb) {}

  public async save(message: NormalizedMessage): Promise<Result<NormalizedMessage, AppError>> {
    try {
      await this.db.normalized_messages.put(message);
      return ok(message);
    } catch (e) {
      return err({ code: 'INFRA', message: `Failed to save message to IndexedDB: ${String(e)}` });
    }
  }

  public async saveBatch(
    messages: NormalizedMessage[],
    dupesInFileCount: number
  ): Promise<Result<SaveBatchResult, AppError>> {
    try {
      const hashes = messages.map((m) => m.contentHash);
      const existingHashesResult = await this.findExistingHashes(hashes);

      if (existingHashesResult.isErr) {
        return err(existingHashesResult.error);
      }

      const existingHashes = existingHashesResult.value;
      const newMessages: NormalizedMessage[] = [];
      let dupesInDbCount = 0;

      for (const msg of messages) {
        if (existingHashes.has(msg.contentHash)) {
          dupesInDbCount++;
        } else {
          newMessages.push(msg);
        }
      }

      if (newMessages.length > 0) {
        await this.db.normalized_messages.bulkPut(newMessages);
      }

      const metrics: IngestionMetrics = {
        totalInput: messages.length + dupesInFileCount,
        dupesInFile: dupesInFileCount,
        dupesInDb: dupesInDbCount,
        newlyInserted: newMessages.length,
      };

      return ok({
        metrics,
        savedMessages: newMessages,
      });
    } catch (e) {
      return err({ code: 'INFRA', message: `Failed to batch save messages: ${String(e)}` });
    }
  }

  public async findExistingHashes(hashes: string[]): Promise<Result<Set<string>, AppError>> {
    try {
      if (hashes.length === 0) {
        return ok(new Set<string>());
      }
      const existingRecords = await this.db.normalized_messages
        .where('contentHash')
        .anyOf(hashes)
        .toArray();

      const existingSet = new Set(existingRecords.map((r) => r.contentHash));
      return ok(existingSet);
    } catch (e) {
      return err({ code: 'INFRA', message: `Failed to query existing hashes: ${String(e)}` });
    }
  }

  public async findAll(options?: QueryOptions): Promise<Result<NormalizedMessage[], AppError>> {
    try {
      let collection = this.db.normalized_messages.toCollection();

      let records = await collection.reverse().toArray();

      if (options?.searchQuery) {
        const query = options.searchQuery.toLowerCase().trim();
        records = records.filter(
          (r) =>
            r.data_raw.toLowerCase().includes(query) ||
            (r.code && r.code.toLowerCase().includes(query)) ||
            (r.address && r.address.toLowerCase().includes(query))
        );
      }

      if (options?.district) {
        records = records.filter((r) => r.district?.toLowerCase() === options.district?.toLowerCase());
      }

      if (options?.hasElevator !== undefined) {
        records = records.filter((r) => r.hasElevator === options.hasElevator);
      }

      if (options?.limit) {
        const offset = options.offset || 0;
        records = records.slice(offset, offset + options.limit);
      }

      return ok(records);
    } catch (e) {
      return err({ code: 'INFRA', message: `Failed to fetch messages from IndexedDB: ${String(e)}` });
    }
  }

  public async clearAll(): Promise<Result<void, AppError>> {
    try {
      await this.db.normalized_messages.clear();
      return ok(undefined);
    } catch (e) {
      return err({ code: 'INFRA', message: `Failed to clear IndexedDB messages: ${String(e)}` });
    }
  }

  public async count(): Promise<Result<number, AppError>> {
    try {
      const count = await this.db.normalized_messages.count();
      return ok(count);
    } catch (e) {
      return err({ code: 'INFRA', message: `Failed to count IndexedDB messages: ${String(e)}` });
    }
  }

  public async findByHash(hash: string): Promise<Result<any, StorageError>> {
    try {
      const record = await this.db.messages.where('hash').equals(hash).first();
      return ok(record ?? null);
    } catch (e) {
      return err(new StorageError(e instanceof Error ? e.message : String(e)));
    }
  }

  public async findByAddressAndPrice(
    address: string | null,
    priceNumeric: number | null,
    priceText: string | null
  ): Promise<Result<{ found: boolean; matchType?: 'ADDRESS_PRICE'; details?: string }, StorageError>> {
    try {
      if (!address && !priceNumeric && !priceText) {
        return ok({ found: false });
      }

      // Check normalized_listings
      const listings = await this.db.normalized_listings.toArray();
      const listingMatch = listings.find((l) => {
        const text = l.data_raw.toLowerCase();
        const addrOk = address ? text.includes(address.toLowerCase()) : true;
        const priceOk =
          priceText
            ? text.includes(priceText.toLowerCase())
            : priceNumeric
              ? l.priceNumeric === priceNumeric
              : true;
        return (address ? addrOk : false) && (priceText || priceNumeric ? priceOk : false);
      });

      if (listingMatch) {
        return ok({
          found: true,
          matchType: 'ADDRESS_PRICE',
          details: `Listings: ${listingMatch.data_raw}`,
        });
      }

      // Check normalized_messages
      const normMsgs = await this.db.normalized_messages.toArray();
      const normMsgMatch = normMsgs.find((m) => {
        const text = m.data_raw.toLowerCase();
        const addrOk = address ? text.includes(address.toLowerCase()) : true;
        const priceOk = priceText ? text.includes(priceText.toLowerCase()) : true;
        return (address ? addrOk : false) && (priceText ? priceOk : false);
      });

      if (normMsgMatch) {
        return ok({
          found: true,
          matchType: 'ADDRESS_PRICE',
          details: `Tin nhắn Đã Chuẩn Hóa: ${normMsgMatch.data_raw}`,
        });
      }

      // Check messages (Buffer)
      const bufferMsgs = await this.db.messages.toArray();
      const bufferMatch = bufferMsgs.find((m) => {
        const text = m.rawContent.toLowerCase();
        const addrOk = address ? text.includes(address.toLowerCase()) : true;
        const priceOk = priceText ? text.includes(priceText.toLowerCase()) : true;
        return (address ? addrOk : false) && (priceText ? priceOk : false);
      });

      if (bufferMatch) {
        return ok({
          found: true,
          matchType: 'ADDRESS_PRICE',
          details: `Message Buffer: ${bufferMatch.rawContent}`,
        });
      }

      return ok({ found: false });
    } catch (e) {
      return err(new StorageError(e instanceof Error ? e.message : String(e)));
    }
  }

  public async findByRawData(
    rawContent: string,
    hash: string
  ): Promise<Result<{ found: boolean; matchType?: 'RAW_DATA'; details?: string }, StorageError>> {
    try {
      const normalizedRaw = rawContent.replace(/\s+/g, ' ').trim().toLowerCase();

      // Check normalized_listings
      const listings = await this.db.normalized_listings.toArray();
      const listingMatch = listings.find(
        (l) => l.contentHash === hash || l.data_raw.replace(/\s+/g, ' ').trim().toLowerCase() === normalizedRaw
      );

      if (listingMatch) {
        return ok({
          found: true,
          matchType: 'RAW_DATA',
          details: `Listings: ${listingMatch.data_raw}`,
        });
      }

      // Check normalized_messages
      const normMsgs = await this.db.normalized_messages.toArray();
      const normMsgMatch = normMsgs.find(
        (m) => m.contentHash === hash || m.data_raw.replace(/\s+/g, ' ').trim().toLowerCase() === normalizedRaw
      );

      if (normMsgMatch) {
        return ok({
          found: true,
          matchType: 'RAW_DATA',
          details: `Tin nhắn Đã Chuẩn Hóa: ${normMsgMatch.data_raw}`,
        });
      }

      // Check messages (Buffer)
      const bufferMsgs = await this.db.messages.toArray();
      const bufferMatch = bufferMsgs.find(
        (m) => m.hash === hash || m.rawContent.replace(/\s+/g, ' ').trim().toLowerCase() === normalizedRaw
      );

      if (bufferMatch) {
        return ok({
          found: true,
          matchType: 'RAW_DATA',
          details: `Message Buffer: ${bufferMatch.rawContent}`,
        });
      }

      return ok({ found: false });
    } catch (e) {
      return err(new StorageError(e instanceof Error ? e.message : String(e)));
    }
  }
}
