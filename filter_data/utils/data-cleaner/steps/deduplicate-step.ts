import { BaseCleaningStep } from './base-step';
import type { CleanListingRecord, CleaningOptions } from '../types';

/**
 * DeduplicateStep
 * Khử trùng lặp bản ghi dựa trên Fingerprint Hash (Địa chỉ + Loại phòng + Giá thuê).
 */
export class DeduplicateStep extends BaseCleaningStep<CleanListingRecord[], CleanListingRecord[]> {
  public readonly name = 'DeduplicateStep';

  public execute(input: CleanListingRecord[], _options?: CleaningOptions): CleanListingRecord[] {
    if (!this.enabled) return input;

    const seenHashes = new Set<string>();
    const uniqueRecords: CleanListingRecord[] = [];

    for (const record of input) {
      const hash = this.computeFingerprintHash(record);
      record.fingerprintHash = hash;

      if (hash && seenHashes.has(hash)) {
        // Bản ghi trùng lặp -> Loại bỏ
        continue;
      }

      if (hash) {
        seenHashes.add(hash);
      }
      uniqueRecords.push(record);
    }

    return uniqueRecords;
  }

  private computeFingerprintHash(record: CleanListingRecord): string {
    const cleanAddr = (record.address || '')
      .toLowerCase()
      .replace(/[^a-z0-9àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệđìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ\s]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const room = (record.roomType || '').toLowerCase().trim();
    const price = record.priceVnd ? String(record.priceVnd) : '';

    if (!cleanAddr && !price) {
      return '';
    }

    return `${cleanAddr}|${room}|${price}`;
  }
}
