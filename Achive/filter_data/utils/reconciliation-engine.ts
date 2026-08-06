import { listingRepository } from '../Data/Database/repository';
import type {
  CleanListingRecord,
  ImportBatch,
  ImportCheckpoint,
  PendingMergeRecord,
  ReconciliationResult,
} from './data-cleaner/types';

/**
 * ReconciliationEngine
 * Động cơ đối chiếu giữa Dataset 1 (Baseline DB) và Dataset 2 (Imported Raw Data).
 * Tự động phân loại tin đã tồn tại, tin chưa tồn tại (chờ duyệt merge)
 * và lưu checkpoint mốc nhập liệu cuối cùng.
 */
export class ReconciliationEngine {
  /**
   * Thực hiện đối chiếu dữ liệu thô nhập vào với cơ sở dữ liệu mốc hiện tại
   */
  public async reconcile(
    importedRecords: CleanListingRecord[],
    sourceKey = 'DEFAULT_SOURCE'
  ): Promise<ReconciliationResult> {
    const batchId = `batch_${Date.now()}`;
    const nowIso = new Date().toISOString();

    // 1. Nạp toàn bộ Fingerprints & Location Hashes của Baseline DB
    const { fingerprints, locations } = await listingRepository.getAllFingerprintsAndLocations();

    const existingMatchedList: CleanListingRecord[] = [];
    const newPendingList: PendingMergeRecord[] = [];
    const priceDiffList: Array<{ existing: CleanListingRecord; imported: CleanListingRecord }> = [];

    // 2. Duyệt qua từng bản ghi nhập vào
    for (let index = 0; index < importedRecords.length; index++) {
      const record = importedRecords[index];

      // Đảm bảo record có fingerprintHash
      const cleanAddr = (record.address || '')
        .toLowerCase()
        .replace(/[^a-z0-9àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệđìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ\s]/gi, '')
        .trim();

      const dist = (record.district || '').toLowerCase().trim();
      const locHash = `${dist}|${cleanAddr}`;
      const fingerprintHash =
        record.fingerprintHash || `${cleanAddr}|${(record.roomType || '').toLowerCase().trim()}|${record.priceVnd || ''}`;

      const existingRecord = fingerprints.get(fingerprintHash);

      if (existingRecord) {
        // Đã tồn tại 100% (Địa điểm + Loại phòng + Giá)
        existingMatchedList.push(existingRecord);

        // Kiểm tra nếu có sự thay đổi giá nhỏ
        if (record.priceVnd && existingRecord.priceVnd && record.priceVnd !== existingRecord.priceVnd) {
          priceDiffList.push({ existing: existingRecord, imported: record });
        }
      } else {
        // Bản ghi CHƯA TỒN TẠI đầy đủ trong DB -> Đưa vào danh sách chờ duyệt merge
        const pendingRecord: PendingMergeRecord = {
          ...record,
          id: record.id || `pending_${Date.now()}_${index}`,
          batchId,
          locationHash: locHash,
          status: 'PENDING',
          createdAt: nowIso,
          rawText: (record.rawRef as string) || (record.address as string) || '',
        };
        newPendingList.push(pendingRecord);
      }
    }

    // 3. Trích xuất Mốc địa điểm nhập liệu cuối cùng (Last Import Checkpoint)
    const lastRecord = importedRecords.length > 0 ? importedRecords[importedRecords.length - 1] : null;
    const lastLocationName = lastRecord
      ? `${lastRecord.district ? lastRecord.district + ' - ' : ''}${lastRecord.address || 'Địa điểm không tên'}`
      : 'Không có dữ liệu';

    const checkpoint: ImportCheckpoint = {
      sourceKey,
      lastLocationName,
      lastFingerprint: lastRecord?.fingerprintHash || '',
      lastRowIndex: importedRecords.length,
      totalImported: importedRecords.length,
      lastUpdatedAt: nowIso,
    };

    // 4. Tạo đối tượng Audit ImportBatch
    const batch: ImportBatch = {
      batchId,
      sourceName: sourceKey,
      totalRows: importedRecords.length,
      matchedExistingCount: existingMatchedList.length,
      newPendingCount: newPendingList.length,
      importedAt: nowIso,
    };

    // 5. Lưu kết quả vào Dexie IndexedDB
    await listingRepository.saveReconciliationData(batch, newPendingList, checkpoint);

    return {
      batchId,
      totalInputRows: importedRecords.length,
      existingMatchedList,
      newPendingList,
      priceDiffList,
      checkpoint,
    };
  }
}

export const reconciliationEngine = new ReconciliationEngine();
