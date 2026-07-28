import Dexie, { type Table } from 'dexie';
import { NormalizedMessage } from '../../domain/data-normalization/entities/normalized-message.entity';

export class QuickZaloDexieDB extends Dexie {
  normalized_messages!: Table<NormalizedMessage, string>;

  constructor() {
    super('QuickZaloExtensionDB');
    this.version(1).stores({
      normalized_messages: '&id, &contentHash, code, district, priceNumeric, createdAt',
    });
  }
}

export const dexieDb = new QuickZaloDexieDB();
