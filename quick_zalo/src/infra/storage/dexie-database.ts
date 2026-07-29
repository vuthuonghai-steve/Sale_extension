import Dexie, { type Table } from 'dexie';
import { NormalizedMessage } from '../../domain/data-normalization/entities/normalized-message.entity';
import { NormalizedListing } from '../../domain/data-normalization/entities/normalized-listing.entity';
import { ImportSession } from '../../domain/data-normalization/entities/import-session.entity';

export class QuickZaloDexieDB extends Dexie {
  normalized_messages!: Table<NormalizedMessage, string>;
  normalized_listings!: Table<NormalizedListing, string>;
  import_sessions!: Table<ImportSession, string>;

  constructor() {
    super('QuickZaloExtensionDB');
    this.version(2).stores({
      normalized_messages: '&id, &contentHash, code, district, priceNumeric, createdAt',
      normalized_listings: '&id, &contentHash, code, district, priceNumeric, templateFamily, isPartiallyParsed, createdAt',
      import_sessions: '&id, importedAt, status',
    });
  }
}

export const dexieDb = new QuickZaloDexieDB();
