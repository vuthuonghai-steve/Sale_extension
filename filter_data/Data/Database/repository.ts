import { db, FilterDataDB } from './db';
import type { CleanListingRecord, CleaningReport } from '../../utils/data-cleaner/types';
import initialSnapshot from './normalized_data_snapshot.json';

export interface ListingFilterQuery {
  district?: string;
  minPriceVnd?: number;
  maxPriceVnd?: number;
  roomType?: string;
  allowPet?: boolean;
  allowEV?: boolean;
  searchKeyword?: string;
  limit?: number;
  offset?: number;
}

export interface DistrictStat {
  district: string;
  totalListings: number;
  avgPriceVnd: number;
}

/**
 * ListingRepository
 * Lớp điều phối các thao tác CRUD và Batch Operations với IndexedDB.
 */
export class ListingRepository {
  private database: FilterDataDB;

  constructor(databaseInstance: FilterDataDB = db) {
    this.database = databaseInstance;
  }

  /**
   * Tự động nạp dữ liệu mẫu (Auto-Seed) từ file normalized_data_snapshot.json
   * nếu cơ sở dữ liệu IndexedDB hiện tại đang trống (0 bản ghi).
   */
  public async ensureSeeded(): Promise<number> {
    const currentCount = await this.count();
    if (currentCount === 0 && Array.isArray(initialSnapshot) && initialSnapshot.length > 0) {
      console.log(
        '[ListingRepository] Database empty. Auto-seeding from normalized_data_snapshot.json...',
        initialSnapshot.length,
        'records'
      );
      await this.saveCleanRecords(initialSnapshot as CleanListingRecord[]);
      return initialSnapshot.length;
    }
    return currentCount;
  }

  /**
   * Lưu hàng loạt bản ghi dữ liệu đã chuẩn hóa vào IndexedDB.
   * Sử dụng batching 5.000 bản ghi/lượt để tối ưu hiệu năng cho 50.000 - 80.000 bản ghi.
   */
  public async saveCleanRecords(
    records: CleanListingRecord[],
    batchSize = 5000
  ): Promise<{ insertedCount: number; executionTimeMs: number }> {
    const startTime = performance.now();
    let insertedCount = 0;

    if (!records || records.length === 0) {
      return { insertedCount: 0, executionTimeMs: 0 };
    }

    // Chia nhỏ dữ liệu thành từng batch
    for (let i = 0; i < records.length; i += batchSize) {
      const chunk = records.slice(i, i + batchSize);

      await this.database.transaction('rw', this.database.listings, async () => {
        await this.database.listings.bulkPut(chunk);
      });

      insertedCount += chunk.length;
    }

    const endTime = performance.now();
    return {
      insertedCount,
      executionTimeMs: Math.round(endTime - startTime),
    };
  }

  /**
   * Truy vấn tìm kiếm và lọc danh sách phòng trọ đã làm sạch
   */
  public async queryListings(options: ListingFilterQuery = {}): Promise<{
    items: CleanListingRecord[];
    total: number;
  }> {
    const {
      district,
      minPriceVnd,
      maxPriceVnd,
      roomType,
      allowPet,
      allowEV,
      searchKeyword,
      limit = 50,
      offset = 0,
    } = options;

    let collection = this.database.listings.toCollection();

    // 1. Tận dụng Index của Dexie để thu hẹp kết quả ban đầu
    if (district && (minPriceVnd !== undefined || maxPriceVnd !== undefined)) {
      const min = minPriceVnd ?? 0;
      const max = maxPriceVnd ?? Number.MAX_SAFE_INTEGER;
      collection = this.database.listings
        .where('[district+priceVnd]')
        .between([district, min], [district, max], true, true);
    } else if (district) {
      collection = this.database.listings.where('district').equals(district);
    } else if (minPriceVnd !== undefined || maxPriceVnd !== undefined) {
      const min = minPriceVnd ?? 0;
      const max = maxPriceVnd ?? Number.MAX_SAFE_INTEGER;
      collection = this.database.listings.where('priceVnd').between(min, max, true, true);
    }

    let filteredRecords = await collection.toArray();

    // 2. Filter in-memory đảm bảo chính xác 100% cho mọi tổ hợp lọc
    if (district) {
      filteredRecords = filteredRecords.filter(
        (rec) => (rec.district || '').toLowerCase() === district.toLowerCase()
      );
    }

    if (minPriceVnd !== undefined) {
      filteredRecords = filteredRecords.filter((rec) => (rec.priceVnd ?? 0) >= minPriceVnd);
    }

    if (maxPriceVnd !== undefined) {
      filteredRecords = filteredRecords.filter((rec) => (rec.priceVnd ?? 0) <= maxPriceVnd);
    }

    if (roomType) {
      const normalizedTarget = roomType.toLowerCase().replace(/pn/g, 'n');
      filteredRecords = filteredRecords.filter((rec) => {
        const current = (rec.roomType || '').toLowerCase().replace(/pn/g, 'n');
        return current.includes(normalizedTarget) || normalizedTarget.includes(current);
      });
    }

    if (allowPet !== undefined) {
      filteredRecords = filteredRecords.filter(
        (rec) => rec.policies?.allowPet === allowPet
      );
    }

    if (allowEV !== undefined) {
      filteredRecords = filteredRecords.filter(
        (rec) => rec.policies?.allowElectricVehicle === allowEV
      );
    }

    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      filteredRecords = filteredRecords.filter(
        (rec) =>
          (rec.address || '').toLowerCase().includes(kw) ||
          (rec.managerCode || '').toLowerCase().includes(kw) ||
          (rec.district || '').toLowerCase().includes(kw) ||
          (rec.rawRef || '').toLowerCase().includes(kw)
      );
    }

    const total = filteredRecords.length;
    const items = filteredRecords.slice(offset, offset + limit);

    return { items, total };
  }

  /**
   * Lưu báo cáo thống kê quá trình làm sạch dữ liệu (CleaningReport)
   */
  public async saveReport(report: CleaningReport): Promise<void> {
    await this.database.cleaningReports.put(report);
  }

  /**
   * Lấy tổng số lượng bản ghi hiện có trong database
   */
  public async count(): Promise<number> {
    return await this.database.listings.count();
  }

  /**
   * Lấy thống kê số lượng & giá trung bình theo từng Quận
   */
  public async getDistrictStats(): Promise<DistrictStat[]> {
    const allListings = await this.database.listings.toArray();
    const map = new Map<string, { count: number; sumPrice: number }>();

    for (const item of allListings) {
      const dist = item.district || 'Khác';
      const price = item.priceVnd || 0;

      const current = map.get(dist) || { count: 0, sumPrice: 0 };
      current.count += 1;
      current.sumPrice += price;
      map.set(dist, current);
    }

    const stats: DistrictStat[] = [];
    for (const [dist, data] of map.entries()) {
      stats.push({
        district: dist,
        totalListings: data.count,
        avgPriceVnd: data.count > 0 ? Math.round(data.sumPrice / data.count) : 0,
      });
    }

    return stats.sort((a, b) => b.totalListings - a.totalListings);
  }

  /**
   * Xóa toàn bộ dữ liệu trong IndexedDB
   */
  public async clearAll(): Promise<void> {
    await this.database.listings.clear();
    await this.database.cleaningReports.clear();
  }
}

export const listingRepository = new ListingRepository();
