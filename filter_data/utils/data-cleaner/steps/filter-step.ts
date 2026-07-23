import { BaseCleaningStep } from './base-step';
import type { CleanListingRecord, CleaningOptions } from '../types';

/**
 * FilterStep
 * Lọc loại bỏ các bản ghi không hợp lệ, tin báo hết phòng (FULL P), hoặc tin rác.
 */
export class FilterStep extends BaseCleaningStep<CleanListingRecord[], CleanListingRecord[]> {
  public readonly name = 'FilterStep';

  public execute(input: CleanListingRecord[], _options?: CleaningOptions): CleanListingRecord[] {
    if (!this.enabled) return input;

    return input.filter((record) => {
      const raw = (record.rawRef || '').trim();
      const isFullText = /FULL P\b|FULL ❌|hết phòng/i.test(raw);

      // Nếu bài đăng báo FULL P / Hết phòng, đánh dấu cờ isFull & syncedTo3rdParty
      if (record.isFull || isFullText) {
        record.isFull = true;
        if (record.syncedTo3rdParty === undefined) {
          record.syncedTo3rdParty = false;
        }
        // Giữ lại nếu có thông tin địa chỉ hoặc nội dung dài hơn 15 ký tự
        if (!record.address && raw.length < 15) {
          return false;
        }
        return true;
      }

      // 2. Loại bỏ mảnh text rác ngắn không có địa chỉ lẫn giá
      if (raw.length < 30 && !record.priceVnd && !record.address) {
        return false;
      }

      // 3. Bắt buộc có giá thuê hợp lệ (từ 500,000 VND trở lên) hoặc có địa chỉ rõ ràng
      if (record.priceVnd && record.priceVnd < 500000) {
        return false;
      }

      if (!record.priceVnd && !record.address) {
        return false;
      }

      return true;
    });
  }
}
