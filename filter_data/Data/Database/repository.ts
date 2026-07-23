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
  isFull?: boolean;
  syncedTo3rdParty?: boolean;
  includeAllStatuses?: boolean;
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
   * nếu cơ sở dữ liệu IndexedDB hiện tại đang trống (0 bản ghi) hoặc có yêu cầu force/reseed.
   */
  public async ensureSeeded(force = false): Promise<number> {
    const currentCount = await this.count();
    const snapshotCount = Array.isArray(initialSnapshot) ? initialSnapshot.length : 0;

    if ((force || currentCount === 0) && snapshotCount > 0) {
      console.log(
        '[ListingRepository] Seeding database from normalized_data_snapshot.json...',
        snapshotCount,
        'records'
      );
      await this.clearAll();
      await this.saveCleanRecords(initialSnapshot as CleanListingRecord[]);
      return snapshotCount;
    }
    return currentCount;
  }

  /**
   * Xóa sạch dữ liệu cũ trong IndexedDB và nạp lại 100% dữ liệu từ normalized_data_snapshot.json
   */
  public async reseed(): Promise<number> {
    return this.ensureSeeded(true);
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
      isFull,
      syncedTo3rdParty,
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

    // Lọc theo cờ isFull
    if (options.includeAllStatuses) {
      // Không lọc theo status, lấy toàn bộ
    } else if (isFull !== undefined) {
      filteredRecords = filteredRecords.filter((rec) => Boolean(rec.isFull) === isFull);
    } else {
      // Mặc định ẩn các phòng đã full khỏi danh sách tìm kiếm bình thường
      filteredRecords = filteredRecords.filter((rec) => !rec.isFull);
    }

    if (syncedTo3rdParty !== undefined) {
      filteredRecords = filteredRecords.filter(
        (rec) => Boolean(rec.syncedTo3rdParty) === syncedTo3rdParty
      );
    }

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
   * Lấy danh sách các phòng Hết (FULL) chưa được đồng bộ sang kênh thứ 3
   */
  public async getPendingFullListings(): Promise<CleanListingRecord[]> {
    const allListings = await this.database.listings.toArray();
    return allListings.filter((rec) => rec.isFull && !rec.syncedTo3rdParty);
  }

  /**
   * Đánh dấu các bản ghi phòng FULL đã cập nhật kênh bên thứ 3 (hoặc xóa khỏi DB)
   */
  public async markFullListingsSynced(ids: string[], deleteFromDb = true): Promise<number> {
    if (!ids || ids.length === 0) return 0;

    if (deleteFromDb) {
      await this.database.listings.bulkDelete(ids);
      return ids.length;
    } else {
      const now = new Date().toISOString();
      await this.database.transaction('rw', this.database.listings, async () => {
        for (const id of ids) {
          await this.database.listings.update(id, {
            syncedTo3rdParty: true,
            syncedAt: now,
          });
        }
      });
      return ids.length;
    }
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
    await this.database.pendingMerges.clear();
    await this.database.importCheckpoints.clear();
    await this.database.importBatches.clear();
  }

  /**
   * Lấy danh sách toàn bộ Fingerprint Hash & Location Hash của Baseline Database
   * để phục vụ so sánh đối chiếu in-memory siêu tốc.
   */
  public async getAllFingerprintsAndLocations(): Promise<{
    fingerprints: Map<string, CleanListingRecord>;
    locations: Set<string>;
  }> {
    const allListings = await this.database.listings.toArray();
    const fingerprints = new Map<string, CleanListingRecord>();
    const locations = new Set<string>();

    for (const item of allListings) {
      if (item.fingerprintHash) {
        fingerprints.set(item.fingerprintHash, item);
      }

      const dist = (item.district || '').toLowerCase().trim();
      const addr = (item.address || '')
        .toLowerCase()
        .replace(/[^a-z0-9àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệđìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ\s]/gi, '')
        .trim();
      if (dist || addr) {
        locations.add(`${dist}|${addr}`);
      }
    }

    return { fingerprints, locations };
  }

  /**
   * Lưu kết quả lượt import (ImportBatch, PendingMerges, ImportCheckpoint) vào IndexedDB
   */
  public async saveReconciliationData(
    batch: import('../../utils/data-cleaner/types').ImportBatch,
    pendingList: import('../../utils/data-cleaner/types').PendingMergeRecord[],
    checkpoint: import('../../utils/data-cleaner/types').ImportCheckpoint
  ): Promise<void> {
    await this.database.transaction(
      'rw',
      [this.database.importBatches, this.database.pendingMerges, this.database.importCheckpoints],
      async () => {
        await this.database.importBatches.put(batch);
        if (pendingList.length > 0) {
          await this.database.pendingMerges.bulkPut(pendingList);
        }
        await this.database.importCheckpoints.put(checkpoint);
      }
    );
  }

  /**
   * Lấy danh sách các tin/địa điểm CHƯA CÓ sẵn trong DB đang chờ duyệt (Pending)
   */
  public async getPendingMerges(): Promise<import('../../utils/data-cleaner/types').PendingMergeRecord[]> {
    const allPending = await this.database.pendingMerges.toArray();
    return allPending.filter((item) => item.status === 'PENDING');
  }

  /**
   * Phê duyệt các địa điểm/phòng chưa có (Accept Merge) -> Chuyển vào DB listings chính
   */
  public async approvePendingMerges(ids: string[]): Promise<number> {
    if (!ids || ids.length === 0) return 0;

    const itemsToApprove = await this.database.pendingMerges.where('id').anyOf(ids).toArray();
    if (itemsToApprove.length === 0) return 0;

    const cleanRecords: CleanListingRecord[] = itemsToApprove.map((item) => {
      const { batchId, locationHash, status, createdAt, rawText, ...clean } = item;
      return clean;
    });

    await this.database.transaction(
      'rw',
      [this.database.listings, this.database.pendingMerges],
      async () => {
        await this.database.listings.bulkPut(cleanRecords);
        for (const id of ids) {
          await this.database.pendingMerges.update(id, { status: 'APPROVED' });
        }
      }
    );

    return itemsToApprove.length;
  }

  /**
   * Từ chối/Bỏ qua các tin/địa điểm chưa có (Reject Merge)
   */
  public async rejectPendingMerges(ids: string[], deletePermanently = false): Promise<number> {
    if (!ids || ids.length === 0) return 0;

    await this.database.transaction('rw', this.database.pendingMerges, async () => {
      if (deletePermanently) {
        await this.database.pendingMerges.bulkDelete(ids);
      } else {
        for (const id of ids) {
          await this.database.pendingMerges.update(id, { status: 'REJECTED' });
        }
      }
    });

    return ids.length;
  }

  /**
   * Xóa vĩnh viễn các bản ghi trong pendingMerges để cho phép import lại hoàn toàn
   */
  public async deletePendingMerges(ids: string[]): Promise<number> {
    if (!ids || ids.length === 0) return 0;
    await this.database.pendingMerges.bulkDelete(ids);
    return ids.length;
  }

  /**
   * Reset mốc checkpoint import để cho phép nạp lại từ đầu từ nguồn dữ liệu
   */
  public async resetImportCheckpoint(sourceKey = 'DEFAULT_SOURCE'): Promise<void> {
    await this.database.importCheckpoints.delete(sourceKey);
  }

  /**
   * Reset toàn bộ dữ liệu pendingMerges và checkpoint của phiên import để Re-import lại dữ liệu thô
   */
  public async resetReconciliationSession(sourceKey = 'DEFAULT_SOURCE'): Promise<void> {
    await this.database.transaction(
      'rw',
      [this.database.pendingMerges, this.database.importCheckpoints],
      async () => {
        await this.database.pendingMerges.clear();
        await this.database.importCheckpoints.delete(sourceKey);
      }
    );
  }

  /**
   * Lấy mốc điểm dừng import gần nhất của một nguồn (sourceKey)
   */
  public async getImportCheckpoint(
    sourceKey = 'DEFAULT_SOURCE'
  ): Promise<import('../../utils/data-cleaner/types').ImportCheckpoint | undefined> {
    return await this.database.importCheckpoints.get(sourceKey);
  }
}

export const listingRepository = new ListingRepository();
