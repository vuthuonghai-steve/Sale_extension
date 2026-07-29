import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { DexieNormalizedListingRepository } from '@infra/storage/dexie-normalized-listing.adapter';
import { DexieImportSessionRepository } from '@infra/storage/dexie-import-session-repository.adapter';
import { QuickZaloDexieDB } from '@infra/storage/dexie-database';
import { DataNormalizationService } from '@domain/data-normalization/services/normalization.service';

describe('DexieNormalizedListingRepository Adapter (BS-IF-01 & BS-IF-02)', () => {
  let db: QuickZaloDexieDB;
  let listingRepo: DexieNormalizedListingRepository;
  let sessionRepo: DexieImportSessionRepository;
  const normalizer = new DataNormalizationService();

  beforeEach(async () => {
    db = new QuickZaloDexieDB();
    listingRepo = new DexieNormalizedListingRepository();
    sessionRepo = new DexieImportSessionRepository();
    await listingRepo.clearAll();
    await sessionRepo.clearAll();
  });

  describe('1. Batch Saving with Session Meta (saveBatch)', () => {
    it('should save a batch of listings and create an import session with metrics', async () => {
      const msg1 = normalizer.normalizeListing({
        id: 'l1',
        data_raw: 'Mã A101\n🏠 Địa chỉ: Thanh Xuân\n💰 Giá: 4.5tr',
      });
      const msg2 = normalizer.normalizeListing({
        id: 'l2',
        data_raw: '/-rose Sky Group\n💥 Nội thất: Đầy đủ\n☘️ Phí dv: Điện 4k',
      });

      const sessionMeta = {
        fileName: 'test_import.json',
        totalMessages: 3,
      };

      const result = await listingRepo.saveBatch([msg1, msg2], 1, sessionMeta);

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        const { metrics, session } = result.value;
        expect(metrics.totalInput).toBe(3);
        expect(metrics.dupesInFile).toBe(1);
        expect(metrics.dupesInDb).toBe(0);
        expect(metrics.newlyInserted).toBe(2);
        expect(session).toBeDefined();
        expect(session?.sourceFileName).toBe('test_import.json');
      }
    });

    it('should calculate DB duplicates when saving overlapping batches', async () => {
      const msg1 = normalizer.normalizeListing({
        id: 'l1',
        data_raw: 'Mã A101\n🏠 Địa chỉ: Thanh Xuân\n💰 Giá: 4.5tr',
      });

      await listingRepo.saveBatch([msg1], 0);

      const result2 = await listingRepo.saveBatch([msg1], 0);

      expect(result2.isOk).toBe(true);
      if (result2.isOk) {
        const { metrics } = result2.value;
        expect(metrics.dupesInDb).toBe(1);
        expect(metrics.newlyInserted).toBe(0);
      }
    });
  });

  describe('2. Querying and Filtering (findAll)', () => {
    beforeEach(async () => {
      const itemTNR = normalizer.normalizeListing({
        id: 'item_tnr',
        data_raw: 'Mã A1204\n🏠 Địa chỉ: 158 Kim Giang\nQuận: Thanh Xuân\n💰 Giá: 4tr5\n👉 Phòng: 201\ndvc 150k',
      });
      const itemSky = normalizer.normalizeListing({
        id: 'item_sky',
        data_raw: '/-rose Sky Listing\n🏠 Địa chỉ: Nguyễn Trãi\nQuận: Thanh Xuân\n💰 Giá: 6tr\n💥 Nội thất: Đầy đủ\n☘️ Phí dv: Điện 4k',
      });
      const item95 = normalizer.normalizeListing({
        id: 'item_95',
        data_raw: '🕌 Địa chỉ: Trần Đại Nghĩa\nQuận: Hai Bà Trưng\n⚡ Chi phí dịch vụ: Điện 4k\n💰 Giá: 5tr',
      });

      await listingRepo.saveBatch([itemTNR, itemSky, item95], 0);
    });

    it('should filter listings by templateFamily', async () => {
      const resSky = await listingRepo.findAll({ templateFamily: 'Sky' });
      expect(resSky.isOk).toBe(true);
      if (resSky.isOk) {
        expect(resSky.value).toHaveLength(1);
        expect(resSky.value[0].templateFamily).toBe('Sky');
      }
    });

    it('should search listings by keyword query', async () => {
      const res = await listingRepo.findAll({ searchQuery: 'Kim Giang' });
      expect(res.isOk).toBe(true);
      if (res.isOk) {
        expect(res.value).toHaveLength(1);
        expect(res.value[0].code).toBe('A1204');
      }
    });

    it('should filter listings by district', async () => {
      const res = await listingRepo.findAll({ district: 'Thanh Xuân' });
      expect(res.isOk).toBe(true);
      if (res.isOk) {
        expect(res.value).toHaveLength(2);
      }
    });
  });

  describe('3. Session Repository Operations', () => {
    it('should retrieve latest import session correctly', async () => {
      const msg = normalizer.normalizeListing({ id: 'msg_s1', data_raw: 'Mã A1\n🏠 Địa chỉ: X' });
      await listingRepo.saveBatch([msg], 0, { fileName: 'file1.json', totalMessages: 1 });
      
      await new Promise((resolve) => setTimeout(resolve, 10));
      
      await listingRepo.saveBatch([msg], 0, { fileName: 'file2.json', totalMessages: 1 });

      const latestRes = await listingRepo.getLatestSession();
      expect(latestRes.isOk).toBe(true);
      if (latestRes.isOk && latestRes.value) {
        expect(latestRes.value.sourceFileName).toBe('file2.json');
      }
    });
  });
});
