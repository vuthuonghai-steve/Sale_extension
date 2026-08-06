import Dexie, { type Table } from 'dexie';
import type {
  CleanListingRecord,
  CleaningReport,
  PendingMergeRecord,
  ImportCheckpoint,
  ImportBatch,
} from '../../utils/data-cleaner/types';

/**
 * FilterDataDB
 * Lớp cơ sở dữ liệu IndexedDB quản lý thông tin phòng trọ/CCMN đã chuẩn hóa.
 * Thiết kế tối ưu cho dung lượng 50.000 - 80.000 bản ghi trong Chrome Extension Environment.
 */
export class FilterDataDB extends Dexie {
  public listings!: Table<CleanListingRecord, string>;
  public cleaningReports!: Table<CleaningReport, string>;
  public pendingMerges!: Table<PendingMergeRecord, string>;
  public importCheckpoints!: Table<ImportCheckpoint, string>;
  public importBatches!: Table<ImportBatch, string>;

  constructor() {
    super('FilterDataDB');

    // Schema Definition Version 1 & 2
    this.version(1).stores({
      listings:
        'id, &fingerprintHash, district, priceVnd, roomType, managerCode, availableDate, [district+priceVnd], [district+roomType]',
      cleaningReports: 'timestamp',
    });

    this.version(2).stores({
      listings:
        'id, &fingerprintHash, district, priceVnd, roomType, managerCode, availableDate, isFull, syncedTo3rdParty, [district+priceVnd], [district+roomType]',
      cleaningReports: 'timestamp',
    });

    this.version(3).stores({
      listings:
        'id, &fingerprintHash, district, priceVnd, roomType, managerCode, availableDate, isFull, syncedTo3rdParty, [district+priceVnd], [district+roomType]',
      cleaningReports: 'timestamp',
      pendingMerges: 'id, batchId, status, locationHash, fingerprintHash, district, createdAt',
      importCheckpoints: 'sourceKey, lastUpdatedAt',
      importBatches: 'batchId, sourceName, importedAt',
    });
  }
}

// Global Singleton Instance cho Database
export const db = new FilterDataDB();
