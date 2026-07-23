import Dexie, { type Table } from 'dexie';
import type { CleanListingRecord, CleaningReport } from '../../utils/data-cleaner/types';

/**
 * FilterDataDB
 * Lớp cơ sở dữ liệu IndexedDB quản lý thông tin phòng trọ/CCMN đã chuẩn hóa.
 * Thiết kế tối ưu cho dung lượng 50.000 - 80.000 bản ghi trong Chrome Extension Environment.
 */
export class FilterDataDB extends Dexie {
  public listings!: Table<CleanListingRecord, string>;
  public cleaningReports!: Table<CleaningReport, string>;

  constructor() {
    super('FilterDataDB');

    // Schema Definition Version 1
    this.version(1).stores({
      listings:
        'id, &fingerprintHash, district, priceVnd, roomType, managerCode, availableDate, [district+priceVnd], [district+roomType]',
      cleaningReports: 'timestamp',
    });
  }
}

// Global Singleton Instance cho Database
export const db = new FilterDataDB();
