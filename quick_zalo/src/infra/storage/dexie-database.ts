import Dexie, { type Table } from 'dexie';
import { NormalizedMessage } from '../../domain/data-normalization/entities/normalized-message.entity';
import { NormalizedListing } from '../../domain/data-normalization/entities/normalized-listing.entity';
import { ImportSession } from '../../domain/data-normalization/entities/import-session.entity';

import { BufferedMessageEntity } from '../../domain/quick-search/entities/buffered-message.entity';

export class QuickZaloDexieDB extends Dexie {
  normalized_messages!: Table<NormalizedMessage, string>;
  normalized_listings!: Table<NormalizedListing, string>;
  import_sessions!: Table<ImportSession, string>;
  messages!: Table<BufferedMessageEntity, string>;

  constructor() {
    super('QuickZaloExtensionDB');
    this.version(3).stores({
      normalized_messages: '&id, &contentHash, code, district, priceNumeric, createdAt',
      normalized_listings: '&id, &contentHash, code, district, priceNumeric, templateFamily, isPartiallyParsed, createdAt',
      import_sessions: '&id, importedAt, status',
      messages: '&id, &hash, conversationId, capturedAt',
    });
  }
}

export const dexieDb = new QuickZaloDexieDB();
